import fs from "node:fs/promises";

import { Hono } from "hono";

import { scanMarkdownFiles } from "./files.js";
import { SecurityError, validatePath } from "./security.js";

const readFile = async (filePath: string, baseDir: string): Promise<string> => {
  const resolvedPath = validatePath(filePath, baseDir);
  return await fs.readFile(resolvedPath, "utf8");
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

  return api;
};
