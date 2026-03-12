#!/usr/bin/env node
import { program } from "commander";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApiRouter } from "./api.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

program
  .name("mdv")
  .description("Local Markdown preview with GitHub-style rendering")
  .version("0.1.0")
  .option("-p, --port <number>", "Port number", "4649")
  .action(async (options) => {
    const baseDir = process.cwd();
    const startPort = parseInt(options.port, 10);
    const app = express();

    app.use(createApiRouter(baseDir));

    // Serve built client
    const clientDir = path.join(__dirname, "../client");
    app.use(express.static(clientDir));
    app.get("/{*splat}", (_req, res) => {
      res.sendFile(path.join(clientDir, "index.html"));
    });

    const tryListen = (port: number): void => {
      const server = app.listen(port, "127.0.0.1", async () => {
        const url = `http://localhost:${port}`;
        console.log(`mdv running at ${url}`);
        console.log(`Serving: ${baseDir}`);
        console.log("Press Ctrl+C to stop");

        const open = (await import("open")).default;
        open(url);
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
