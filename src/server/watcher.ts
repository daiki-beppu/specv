import fs from "node:fs";
import path from "node:path";

import { IGNORED_DIRS } from "./files";

export type WatchEventType = "add" | "change" | "unlink";
export interface WatchEvent {
  path: string;
  type: WatchEventType;
}
export type WatchCallback = (event: WatchEvent) => void;

const DEBOUNCE_MS = 200;

const isIgnored = (filePath: string): boolean => {
  const parts = filePath.split(path.sep);
  return parts.some((part) => IGNORED_DIRS.has(part));
};

const isMarkdown = (filePath: string): boolean =>
  path.extname(filePath) === ".md";

const isSafePath = (baseDir: string, filePath: string): boolean => {
  const normalized = path.normalize(filePath);
  const resolved = path.resolve(baseDir, normalized);
  return resolved.startsWith(baseDir + path.sep) || resolved === baseDir;
};

const resolveEventType = (
  fullPath: string,
  normalized: string,
  knownFiles: Set<string>
): WatchEventType => {
  if (!fs.existsSync(fullPath)) {
    knownFiles.delete(normalized);
    return "unlink";
  }
  if (knownFiles.has(normalized)) {
    return "change";
  }
  knownFiles.add(normalized);
  return "add";
};

const scanExisting = (dir: string, knownFiles: Set<string>, rel = ""): void => {
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && !IGNORED_DIRS.has(entry.name)) {
        scanExisting(
          path.join(dir, entry.name),
          knownFiles,
          path.join(rel, entry.name)
        );
      } else if (entry.isFile() && isMarkdown(entry.name)) {
        knownFiles.add(path.join(rel, entry.name));
      }
    }
  } catch {
    // ディレクトリ読み取りエラーは無視
  }
};

export const createWatcher = (
  baseDir: string,
  onEvent: WatchCallback
): { close: () => void } => {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const knownFiles = new Set<string>();

  scanExisting(baseDir, knownFiles);

  const watcher = fs.watch(baseDir, { recursive: true }, (_event, filename) => {
    if (!filename) {
      return;
    }

    const normalized = path.normalize(filename);
    if (!isMarkdown(normalized) || isIgnored(normalized)) {
      return;
    }
    if (!isSafePath(baseDir, normalized)) {
      return;
    }

    if (timers.has(normalized)) {
      clearTimeout(timers.get(normalized));
    }

    timers.set(
      normalized,
      setTimeout(() => {
        timers.delete(normalized);
        const fullPath = path.resolve(baseDir, normalized);
        const type = resolveEventType(fullPath, normalized, knownFiles);
        onEvent({ path: normalized, type });
      }, DEBOUNCE_MS)
    );
  });

  return {
    close: () => {
      watcher.close();
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    },
  };
};
