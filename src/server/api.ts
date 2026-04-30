import fs from "node:fs/promises";
import path from "node:path";

import { AppError, type ApiErrorResponse } from "@shared/errors";
import type {
  FileChangedPayload,
  FilesResponse,
  TreeChangedPayload,
  WatchEventName,
} from "@shared/types";
import { Hono } from "hono";

import { scanMarkdownFiles } from "./files";
import { validateImagePath, validatePath } from "./security";
import { createWatcher as defaultCreateWatcher } from "./watcher";
import type { WatchCallback } from "./watcher";

const buildAppErrorResponse = (error: AppError): ApiErrorResponse => ({
  code: error.code,
  error: error.message,
});

const IMAGE_CONTENT_TYPES: Record<string, string> = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const readFile = (filePath: string, baseDir: string): Promise<string> => {
  const resolvedPath = validatePath(filePath, baseDir);
  return fs.readFile(resolvedPath, "utf8");
};

const readImage = async (
  filePath: string,
  baseDir: string
): Promise<{ contentType: string; data: Buffer }> => {
  const resolvedPath = validateImagePath(filePath, baseDir);
  const ext = path.extname(resolvedPath).toLowerCase();
  const contentType = IMAGE_CONTENT_TYPES[ext] ?? "application/octet-stream";
  const data = await fs.readFile(resolvedPath);
  return { contentType, data };
};

type WatcherFactory = (
  baseDir: string,
  onEvent: WatchCallback
) => { close: () => void };

interface ApiRouterOptions {
  createWatcher?: WatcherFactory;
}

const TREE_DEBOUNCE_MS = 300;

interface SSEMessage {
  data: string;
  event: WatchEventName;
}
type SSEListener = (msg: SSEMessage) => void;

const setupWatcher = (
  baseDir: string,
  factory: WatcherFactory,
  broadcast: (msg: SSEMessage) => void
) => {
  let treeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  factory(baseDir, (event) => {
    if (event.type === "change") {
      broadcast({
        data: JSON.stringify({
          path: event.path,
        } satisfies FileChangedPayload),
        event: "file-changed",
      });
    } else {
      if (treeDebounceTimer) {
        clearTimeout(treeDebounceTimer);
      }
      treeDebounceTimer = setTimeout(async () => {
        try {
          const files = await scanMarkdownFiles(baseDir);
          broadcast({
            data: JSON.stringify({ files } satisfies TreeChangedPayload),
            event: "tree-changed",
          });
        } catch {
          // Scan failure is non-fatal
        }
      }, TREE_DEBOUNCE_MS);
    }
  });
};

export const createApiRouter = (
  baseDir: string,
  options?: ApiRouterOptions
): Hono => {
  const api = new Hono();
  const sseListeners = new Set<SSEListener>();
  const encoder = new TextEncoder();

  const broadcast = (msg: SSEMessage) => {
    for (const listener of sseListeners) {
      listener(msg);
    }
  };

  setupWatcher(
    baseDir,
    options?.createWatcher ?? defaultCreateWatcher,
    broadcast
  );

  api.get("/api/files", async (c) => {
    try {
      const files = await scanMarkdownFiles(baseDir);
      return c.json<FilesResponse>({ files });
    } catch {
      return c.json<ApiErrorResponse>({ error: "Failed to scan files" }, 500);
    }
  });

  api.get("/api/file", async (c) => {
    const filePath = c.req.query("path");
    if (!filePath) {
      return c.json<ApiErrorResponse>(
        { error: "path query parameter is required" },
        400
      );
    }

    try {
      const content = await readFile(filePath, baseDir);
      return c.text(content);
    } catch (error) {
      if (error instanceof AppError) {
        return c.json<ApiErrorResponse>(buildAppErrorResponse(error), 400);
      }
      return c.json<ApiErrorResponse>({ error: "File not found" }, 404);
    }
  });

  api.get("/api/image", async (c) => {
    const filePath = c.req.query("path");
    if (!filePath) {
      return c.json<ApiErrorResponse>(
        { error: "path query parameter is required" },
        400
      );
    }

    try {
      const { contentType, data } = await readImage(filePath, baseDir);
      return c.body(new Uint8Array(data), 200, { "Content-Type": contentType });
    } catch (error) {
      if (error instanceof AppError) {
        return c.json<ApiErrorResponse>(buildAppErrorResponse(error), 400);
      }
      return c.json<ApiErrorResponse>({ error: "Image not found" }, 404);
    }
  });

  api.get("/api/watch", (_c) => {
    let listener: SSEListener | null = null;

    const stream = new ReadableStream({
      cancel() {
        if (listener) {
          sseListeners.delete(listener);
        }
      },
      start(controller) {
        listener = (msg) => {
          controller.enqueue(
            encoder.encode(`event: ${msg.event}\ndata: ${msg.data}\n\n`)
          );
        };
        sseListeners.add(listener);
      },
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
      },
    });
  });

  return api;
};
