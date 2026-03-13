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

program
  .name("specv")
  .description("Local Markdown preview with GitHub-style rendering")
  .version("0.2.0")
  .option("-p, --port <number>", "Port number", "4649")
  .action((options) => {
    const baseDir = process.cwd();
    const startPort = Number.parseInt(options.port, 10);
    const clientDir = path.join(currentDir, "../client");

    const indexHtml = fs.readFileSync(
      path.join(clientDir, "index.html"),
      "utf8"
    );
    const app = new Hono();

    // API routes
    app.route("/", createApiRouter(baseDir));

    // Serve built client
    app.use("/*", serveStatic({ root: clientDir }));

    // SPA fallback
    app.get("/*", (c) => c.html(indexHtml));

    const tryListen = (port: number): void => {
      const server = serve(
        { fetch: app.fetch, hostname: "127.0.0.1", port },
        (info) => {
          const url = `http://localhost:${info.port}`;
          console.log(`specv running at ${url}`);
          console.log(`Serving: ${baseDir}`);
          console.log("Press Ctrl+C to stop");

          openInBrowser(url);
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
