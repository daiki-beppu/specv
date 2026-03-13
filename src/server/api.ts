import fs from "node:fs/promises";
import path from "node:path";

import { Hono } from "hono";

import { scanMarkdownFiles } from "./files.js";
import { SecurityError, validateImagePath, validatePath } from "./security.js";

const IMAGE_CONTENT_TYPES: Record<string, string> = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const readFile = async (filePath: string, baseDir: string): Promise<string> => {
  const resolvedPath = validatePath(filePath, baseDir);
  return await fs.readFile(resolvedPath, "utf8");
};

const readImage = async (
  filePath: string,
  baseDir: string
): Promise<{ data: Buffer; contentType: string }> => {
  const resolvedPath = validateImagePath(filePath, baseDir);
  const ext = path.extname(resolvedPath).toLowerCase();
  const contentType = IMAGE_CONTENT_TYPES[ext] ?? "application/octet-stream";
  const data = await fs.readFile(resolvedPath);
  return { contentType, data };
};

export const createApiRouter = (baseDir: string): Hono => {
  const api = new Hono();

  api.get("/api/files", async (c) => {
    try {
      const files = await scanMarkdownFiles(baseDir);
      return c.json({ files });
    } catch {
      return c.json({ error: "Failed to scan files" }, 500);
    }
  });

  api.get("/api/file", async (c) => {
    const filePath = c.req.query("path");
    if (!filePath) {
      return c.json({ error: "path query parameter is required" }, 400);
    }

    try {
      const content = await readFile(filePath, baseDir);
      return c.text(content);
    } catch (error) {
      if (error instanceof SecurityError) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: "File not found" }, 404);
    }
  });

  api.get("/api/image", async (c) => {
    const filePath = c.req.query("path");
    if (!filePath) {
      return c.json({ error: "path query parameter is required" }, 400);
    }

    try {
      const { data, contentType } = await readImage(filePath, baseDir);
      return c.body(data, 200, { "Content-Type": contentType });
    } catch (error) {
      if (error instanceof SecurityError) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: "Image not found" }, 404);
    }
  });

  return api;
};
