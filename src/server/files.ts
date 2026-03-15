import type { Dirent } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import type { FileNode } from "@shared/types";

export const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".hg",
  ".svn",
  "__pycache__",
  ".next",
  ".nuxt",
]);

const MAX_DEPTH = 10;

type ScanFn = (
  baseDir: string,
  relativePath: string,
  depth: number
) => Promise<FileNode[]>;

const sortEntries = (entries: Dirent[]): Dirent[] =>
  entries.toSorted((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) {
      return -1;
    }
    if (!a.isDirectory() && b.isDirectory()) {
      return 1;
    }
    return a.name.localeCompare(b.name);
  });

const buildFileNode = (entry: Dirent, relativePath: string): FileNode => ({
  name: entry.name,
  path: path.join(relativePath, entry.name),
});

const buildDirNode = (
  entry: Dirent,
  relativePath: string,
  children: FileNode[]
): FileNode => ({
  children,
  name: entry.name,
  path: path.join(relativePath, entry.name),
});

const readAndSortEntries = async (
  baseDir: string,
  relativePath: string
): Promise<Dirent[]> => {
  const entries = await fs.readdir(path.join(baseDir, relativePath), {
    withFileTypes: true,
  });
  return sortEntries(entries);
};

const collectNodes = async (
  sorted: Dirent[],
  baseDir: string,
  relativePath: string,
  depth: number,
  scan: ScanFn
): Promise<FileNode[]> => {
  const result: FileNode[] = [];

  for (const entry of sorted) {
    if (entry.isDirectory() && !IGNORED_DIRS.has(entry.name)) {
      const children = await scan(
        baseDir,
        path.join(relativePath, entry.name),
        depth + 1
      );
      if (children.length > 0) {
        result.push(buildDirNode(entry, relativePath, children));
      }
    } else if (!entry.isDirectory() && entry.name.endsWith(".md")) {
      result.push(buildFileNode(entry, relativePath));
    }
  }

  return result;
};

export const scanMarkdownFiles = async (
  baseDir: string,
  relativePath = "",
  depth = 0
): Promise<FileNode[]> => {
  if (depth >= MAX_DEPTH) {
    return [];
  }

  const sorted = await readAndSortEntries(baseDir, relativePath);
  return collectNodes(sorted, baseDir, relativePath, depth, scanMarkdownFiles);
};
