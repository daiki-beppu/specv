import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    outDir: "dist/client",
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(currentDir, "./src/client"),
      "@server": path.resolve(currentDir, "./src/server"),
      "@shared": path.resolve(currentDir, "./src/shared"),
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:4649",
    },
  },
  test: {
    environment: "node",
    exclude: ["e2e/**", "node_modules/**", ".worktrees/**"],
    globals: true,
  },
});
