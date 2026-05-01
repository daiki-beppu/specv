import { Hono } from "hono";

import { registerFileRoutes } from "./api/file-routes";
import { createSseBroadcaster } from "./api/sse-broadcaster";
import { registerWatchRoutes, type WatcherFactory } from "./api/watch-routes";
import { createWatcher as defaultCreateWatcher } from "./watcher";

interface ApiRouterOptions {
  createWatcher?: WatcherFactory;
}

export const createApiRouter = (
  baseDir: string,
  options?: ApiRouterOptions
): Hono => {
  const api = new Hono();
  const broadcaster = createSseBroadcaster();

  registerFileRoutes(api, baseDir);
  registerWatchRoutes(
    api,
    baseDir,
    options?.createWatcher ?? defaultCreateWatcher,
    broadcaster
  );

  return api;
};
