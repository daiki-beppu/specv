import fs from "node:fs/promises";

import { Router } from "express";
import type { Request, Response } from "express";

import { scanMarkdownFiles } from "./files.js";
import { validatePath } from "./security.js";

const isSecurityError = (error: unknown): boolean =>
  error instanceof Error &&
  (error.message.includes("traversal") || error.message.includes("Only .md"));

const readAndSendFile = async (
  filePath: string,
  baseDir: string,
  res: Response
) => {
  const resolvedPath = validatePath(filePath, baseDir);
  const content = await fs.readFile(resolvedPath, "utf8");
  res.type("text/plain; charset=utf-8").send(content);
};

const handleFileError = (error: unknown, res: Response) => {
  if (isSecurityError(error)) {
    res.status(400).json({ error: (error as Error).message });
    return;
  }
  res.status(404).json({ error: "File not found" });
};

const handleFiles = async (_req: Request, res: Response, baseDir: string) => {
  try {
    const files = await scanMarkdownFiles(baseDir);
    res.json({ files });
  } catch {
    res.status(500).json({ error: "Failed to scan files" });
  }
};

const handleFile = async (req: Request, res: Response, baseDir: string) => {
  const filePath = req.query.path;
  if (!filePath || typeof filePath !== "string") {
    res.status(400).json({ error: "path query parameter is required" });
    return;
  }

  try {
    await readAndSendFile(filePath, baseDir, res);
  } catch (error) {
    handleFileError(error, res);
  }
};

const wrapAsync =
  (handler: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response) => {
    const safeHandler = async () => {
      try {
        await handler(req, res);
      } catch {
        if (!res.headersSent) {
          res.status(500).json({ error: "Internal server error" });
        }
      }
    };
    safeHandler();
  };

export const createApiRouter = (baseDir: string): Router => {
  const router = Router();

  router.get(
    "/api/files",
    wrapAsync((req, res) => handleFiles(req, res, baseDir))
  );

  router.get(
    "/api/file",
    wrapAsync((req, res) => handleFile(req, res, baseDir))
  );

  return router;
};
