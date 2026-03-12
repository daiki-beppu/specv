import { Router } from "express";
import fs from "node:fs/promises";
import { scanMarkdownFiles } from "./files.js";
import { validatePath } from "./security.js";

export function createApiRouter(baseDir: string): Router {
  const router = Router();

  router.get("/api/files", async (_req, res) => {
    try {
      const files = await scanMarkdownFiles(baseDir);
      res.json({ files });
    } catch (error) {
      res.status(500).json({ error: "Failed to scan files" });
    }
  });

  router.get("/api/file", async (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) {
      res.status(400).json({ error: "path query parameter is required" });
      return;
    }

    try {
      const resolvedPath = validatePath(filePath, baseDir);
      const content = await fs.readFile(resolvedPath, "utf-8");
      res.type("text/plain; charset=utf-8").send(content);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("traversal") || error.message.includes("Only .md")) {
          res.status(400).json({ error: error.message });
          return;
        }
      }
      res.status(404).json({ error: "File not found" });
    }
  });

  return router;
}
