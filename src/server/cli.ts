#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { program } from "commander";
import { Hono } from "hono";

import { createApiRouter } from "./api.js";

const currentDir = import.meta.dirname;

const openInBrowser = async (url: string): Promise<void> => {
  const mod = await import("open");
  await mod.default(url);
};

const registerLifecycle = (app: Hono, onDisconnect: () => void) => {
  app.get("/api/lifecycle", (_c) => {
    const stream = new ReadableStream({
      cancel() {
        onDisconnect();
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

const createApp = (
  baseDir: string,
  clientDir: string,
  onDisconnect: () => void
) => {
  const indexHtmlPath = path.join(clientDir, "index.html");
  const hasClient = fs.existsSync(indexHtmlPath);
  const app = new Hono();

  registerLifecycle(app, onDisconnect);
  app.route("/", createApiRouter(baseDir));

  if (hasClient) {
    const indexHtml = fs.readFileSync(indexHtmlPath, "utf8");
    app.use("/*", serveStatic({ root: clientDir }));
    app.get("/*", (c) => c.html(indexHtml));
  }

  return app;
};

program
  .name("specv")
  .description("Local Markdown preview with GitHub-style rendering")
  .version("0.2.0")
  .option("-p, --port <number>", "Port number", "4649")
  .action((options) => {
    const baseDir = process.cwd();
    const startPort = Number.parseInt(options.port, 10);
    const clientDir = path.join(currentDir, "../client");
    const app = createApp(baseDir, clientDir, () => {
      console.log("Client disconnected, shutting down server...");
      process.exit(0);
    });

    const tryListen = (port: number): void => {
      const server = serve(
        { fetch: app.fetch, hostname: "127.0.0.1", port },
        async (info) => {
          const url = `http://localhost:${info.port}`;
          console.log(`specv running at ${url}`);
          console.log(`Serving: ${baseDir}`);
          console.log("Press Ctrl+C to stop");

          try {
            await openInBrowser(url);
          } catch (error: unknown) {
            console.error("Failed to open browser:", error);
          }
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
