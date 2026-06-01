#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { serveStatic } from "@hono/node-server/serve-static";
import { isObjectRecord } from "@shared/is-object-record";
import { program } from "commander";
import { Hono } from "hono";

import { createApiRouter } from "./api";
import { registerLifecycle } from "./lifecycle";
import { announceAndOpen, listenWithFallback } from "./listen";

const packageJsonPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../package.json"
);

const isPkgShape = (value: unknown): value is { version: string } => {
  if (!isObjectRecord(value)) {
    return false;
  }
  return typeof value.version === "string";
};

const parsedPkg: unknown = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
if (!isPkgShape(parsedPkg)) {
  throw new Error("Invalid package.json: missing version");
}
const pkg = parsedPkg;

const currentDir = import.meta.dirname;

const serveClient = (app: Hono, clientDir: string) => {
  const indexHtmlPath = path.join(clientDir, "index.html");
  if (fs.existsSync(indexHtmlPath)) {
    const indexHtml = fs.readFileSync(indexHtmlPath, "utf8");
    app.use("/*", serveStatic({ root: clientDir }));
    app.get("/*", (c) => c.html(indexHtml));
  }
};

const createApp = (
  baseDir: string,
  clientDir: string,
  onDisconnect?: () => void
) => {
  const app = new Hono();

  // SSE 端点は常時提供し、自動停止だけを onDisconnect の有無で切り替える。
  // `--no-auto-close` でも `/api/lifecycle` を登録しないと、未登録ルートが
  // `serveClient` の `/*` フォールバックに落ちて text/html を返し、
  // クライアントの EventSource が error → 誤った切断バナーを出すため。
  registerLifecycle(app, onDisconnect);
  app.route("/", createApiRouter(baseDir));
  serveClient(app, clientDir);

  return app;
};

export const getNetworkConfig = (options: { host: boolean }) => ({
  enableNetwork: options.host,
  hostname: options.host ? "0.0.0.0" : "127.0.0.1",
});

interface CliOptions {
  port: string;
  host?: boolean;
  autoClose: boolean;
}

program
  .name("specv")
  .description("Local Markdown preview with GitHub-style rendering")
  .version(pkg.version)
  .option("-p, --port <number>", "Port number", "4649")
  .option("--host", "Expose to local network (enables QR code)")
  .option("--no-auto-close", "Disable auto-close on client disconnect")
  .action(async (options: CliOptions) => {
    const baseDir = process.cwd();
    const startPort = Number.parseInt(options.port, 10);
    const clientDir = path.join(currentDir, "../client");
    const networkConfig = getNetworkConfig({ host: Boolean(options.host) });
    const app = createApp(
      baseDir,
      clientDir,
      options.autoClose
        ? () => {
            console.log("Client disconnected, shutting down server...");
            process.exit(0);
          }
        : undefined
    );

    try {
      const { port } = await listenWithFallback(
        app,
        networkConfig.hostname,
        startPort
      );
      await announceAndOpen({
        port,
        baseDir,
        enableNetwork: networkConfig.enableNetwork,
        version: pkg.version,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Failed to start server: ${message}`);
      process.exit(1);
    }
  });

program.parse();
