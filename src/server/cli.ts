#!/usr/bin/env node
import fs from "node:fs";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { program } from "commander";
import { Hono } from "hono";

import { createApiRouter } from "./api";
import { getLocalIpAddress } from "./network";
import { openInBrowser } from "./open-browser";
import { displayQrCode } from "./qr-display";

const packageJsonPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../package.json"
);
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
  version: string;
};

const currentDir = import.meta.dirname;

const DISCONNECT_GRACE_MS = 2000;

const registerLifecycle = (app: Hono, onDisconnect: () => void) => {
  let connections = 0;
  let graceTimer: ReturnType<typeof setTimeout> | null = null;

  app.get("/api/lifecycle", (_c) => {
    connections += 1;
    if (graceTimer) {
      clearTimeout(graceTimer);
      graceTimer = null;
    }

    const stream = new ReadableStream({
      cancel() {
        connections -= 1;
        if (connections === 0) {
          graceTimer = setTimeout(() => {
            if (connections === 0) {
              onDisconnect();
            }
          }, DISCONNECT_GRACE_MS);
        }
      },
      start(controller) {
        controller.enqueue("data: connected\n\n");
      },
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
      },
    });
  });
};

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

  if (onDisconnect) {
    registerLifecycle(app, onDisconnect);
  }
  app.route("/", createApiRouter(baseDir));
  serveClient(app, clientDir);

  return app;
};

export const getNetworkConfig = (options: { host: boolean }) => ({
  enableNetwork: options.host,
  hostname: options.host ? "0.0.0.0" : "127.0.0.1",
});

program
  .name("specv")
  .description("Local Markdown preview with GitHub-style rendering")
  .version(pkg.version)
  .option("-p, --port <number>", "Port number", "4649")
  .option("--host", "Expose to local network (enables QR code)")
  .option("--no-auto-close", "Disable auto-close on client disconnect")
  .action((options) => {
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

    const announceAndOpen = async (info: AddressInfo): Promise<void> => {
      const localUrl = `http://localhost:${info.port}`;
      console.log("");
      console.log(`  specv v${program.version()}`);
      console.log("");
      console.log(`  ➜  Local:   ${localUrl}`);

      const ip = networkConfig.enableNetwork ? getLocalIpAddress() : null;
      const networkUrl = ip ? `http://${ip}:${info.port}` : null;

      if (networkUrl) {
        console.log(`  ➜  Network: ${networkUrl}`);
      } else if (!networkConfig.enableNetwork) {
        console.log("  ➜  Network: use --host to expose to local network");
      }

      console.log("");
      console.log(`  Serving: ${baseDir}`);

      // Dev:host 時は Vite プラグイン側で QR を表示するためスキップ
      if (networkUrl && !process.env.SPECV_HOST) {
        console.log("");
        displayQrCode(networkUrl);
      }

      console.log("");
      console.log("  Press Ctrl+C to stop");

      try {
        await openInBrowser(localUrl);
      } catch {
        console.log(`  Open ${localUrl} in your browser`);
      }
    };

    const tryListen = (port: number): void => {
      const server = serve(
        { fetch: app.fetch, hostname: networkConfig.hostname, port },
        (info) => {
          void announceAndOpen(info);
        }
      );

      server.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE" && port < startPort + 10) {
          console.log(`Port ${port} is in use, trying ${port + 1}...`);
          tryListen(port + 1);
        } else {
          console.error(`Failed to start server: ${err.message}`);
          process.exit(1);
        }
      });
    };

    tryListen(startPort);
  });

program.parse();
