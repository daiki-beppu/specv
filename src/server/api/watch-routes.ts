import type { FileChangedPayload, TreeChangedPayload } from "@shared/types";
import type { Hono } from "hono";

import { scanMarkdownFiles } from "../files";
import type { WatchCallback } from "../watcher";
import type { SseBroadcaster } from "./sse-broadcaster";

export type WatcherFactory = (
  baseDir: string,
  onEvent: WatchCallback
) => { close: () => void };

const TREE_DEBOUNCE_MS = 300;

const setupWatcher = (
  baseDir: string,
  factory: WatcherFactory,
  broadcaster: SseBroadcaster
) => {
  let treeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  factory(baseDir, (event) => {
    if (event.type === "change") {
      broadcaster.broadcast({
        data: JSON.stringify({
          path: event.path,
        } satisfies FileChangedPayload),
        event: "file-changed",
      });
    } else {
      if (treeDebounceTimer !== null) {
        clearTimeout(treeDebounceTimer);
      }
      treeDebounceTimer = setTimeout(() => {
        void (async () => {
          try {
            const files = await scanMarkdownFiles(baseDir);
            broadcaster.broadcast({
              data: JSON.stringify({ files } satisfies TreeChangedPayload),
              event: "tree-changed",
            });
          } catch {
            // Scan failure is non-fatal
          }
        })();
      }, TREE_DEBOUNCE_MS);
    }
  });
};

export const registerWatchRoutes = (
  api: Hono,
  baseDir: string,
  factory: WatcherFactory,
  broadcaster: SseBroadcaster
): void => {
  setupWatcher(baseDir, factory, broadcaster);

  api.get("/api/watch", (_c) => broadcaster.attachSseStream());
};
