import fs from "node:fs/promises";
import path from "node:path";

import { AppError, type ApiErrorResponse } from "@shared/errors";
import type { FilesResponse } from "@shared/types";
import type { Hono } from "hono";

import { scanMarkdownFiles } from "../files";
import { validateImagePath, validatePath } from "../security";

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

export const registerFileRoutes = (api: Hono, baseDir: string): void => {
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
    if (filePath === undefined || filePath === "") {
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
    if (filePath === undefined || filePath === "") {
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
};
