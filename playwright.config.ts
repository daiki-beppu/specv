import path from "node:path";

import { defineConfig } from "@playwright/test";

const fixturesDir = path.resolve(import.meta.dirname, "e2e/fixtures");
const cliPath = path.resolve(import.meta.dirname, "dist/server/cli.mjs");

export default defineConfig({
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  reporter: process.env.CI ? "github" : "list",
  retries: 0,
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:4650",
  },
  webServer: {
    command: `node ${cliPath} -p 4650 --no-auto-close`,
    cwd: fixturesDir,
    port: 4650,
    reuseExistingServer: !process.env.CI,
  },
});
