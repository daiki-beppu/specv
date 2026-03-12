#!/usr/bin/env node
import path from "node:path";

import { program } from "commander";
import express from "express";

import { createApiRouter } from "./api.js";

const currentDir = import.meta.dirname;

const openInBrowser = async (url: string): Promise<void> => {
  const mod = await import("open");
  await mod.default(url);
};

program
  .name("mdv")
  .description("Local Markdown preview with GitHub-style rendering")
  .version("0.1.0")
  .option("-p, --port <number>", "Port number", "4649")
  .action((options) => {
    const baseDir = process.cwd();
    const startPort = Number.parseInt(options.port, 10);
    const app = express();

    app.use(createApiRouter(baseDir));

    // Serve built client
    const clientDir = path.join(currentDir, "../client");
    app.use(express.static(clientDir));
    app.get("/{*splat}", (_req, res) => {
      res.sendFile(path.join(clientDir, "index.html"));
    });

    const tryListen = (port: number): void => {
      const server = app.listen(port, "127.0.0.1", () => {
        const url = `http://localhost:${port}`;
        console.log(`mdv running at ${url}`);
        console.log(`Serving: ${baseDir}`);
        console.log("Press Ctrl+C to stop");

        openInBrowser(url);
      });

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
