import fs from "node:fs/promises";
import path from "node:path";
import type { FileNode } from "../shared/types.js";

export type { FileNode };

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".hg",
  ".svn",
  "__pycache__",
  ".next",
  ".nuxt",
]);

const MAX_DEPTH = 5;

export async function scanMarkdownFiles(
  baseDir: string,
  relativePath = "",
  depth = 0,
): Promise<FileNode[]> {
  if (depth >= MAX_DEPTH) return [];

  const fullPath = path.join(baseDir, relativePath);
  const entries = await fs.readdir(fullPath, { withFileTypes: true });
  const result: FileNode[] = [];

  const sorted = entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const entry of sorted) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;

      const children = await scanMarkdownFiles(
        baseDir,
        path.join(relativePath, entry.name),
        depth + 1,
      );

      if (children.length > 0) {
        result.push({
          path: path.join(relativePath, entry.name),
          name: entry.name,
          children,
        });
      }
    } else if (entry.name.endsWith(".md")) {
      result.push({
        path: path.join(relativePath, entry.name),
        name: entry.name,
      });
    }
  }

  return result;
}
