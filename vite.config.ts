import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

import { qrcodePlugin } from "./vite-plugin-qrcode.ts";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    outDir: "dist/client",
  },
  // https://oxc.rs/docs/guide/usage/formatter/config-file-reference.html
  fmt: {
    arrowParens: "always",
    bracketSameLine: false,
    bracketSpacing: true,
    endOfLine: "lf",
    experimentalSortImports: {
      ignoreCase: true,
      newlinesBetween: true,
      order: "asc",
    },
    experimentalSortPackageJson: true,
    jsxSingleQuote: false,
    printWidth: 80,
    quoteProps: "as-needed",
    semi: true,
    singleQuote: false,
    tabWidth: 2,
    trailingComma: "es5",
    useTabs: false,
  },
  lint: {
    categories: {
      correctness: "error",
      pedantic: "error",
      perf: "error",
      suspicious: "error",
    },
    env: { browser: true },
    ignorePatterns: [
      "src/client/components/ui/**",
      "!src/client/components/ui/tree.tsx",
    ],
    plugins: [
      "eslint",
      "typescript",
      "unicorn",
      "oxc",
      "import",
      "jsdoc",
      "node",
      "promise",
      "react",
      "react-perf",
      "jsx-a11y",
      "vitest",
    ],
    rules: {
      "import/max-dependencies": "off",
      "import/no-unassigned-import": "off",
      "jest/valid-title": "off",
      "max-lines-per-function": "off",
      "no-await-in-loop": "off",
      "react/no-array-index-key": "off",
      "react/react-in-jsx-scope": "off",
      "react_perf/jsx-no-jsx-as-prop": "off",
      "react_perf/jsx-no-new-array-as-prop": "off",
      "react_perf/jsx-no-new-object-as-prop": "off",
      "unicorn/no-array-callback-reference": "off",
      "unicorn/no-null": "off",
    },
  },
  pack: {
    dts: true,
    entry: ["src/server/cli.ts"],
    format: ["esm"],
    outDir: "dist/server",
  },
  plugins: [react(), tailwindcss(), qrcodePlugin()],
  resolve: {
    alias: {
      "@": path.resolve(currentDir, "./src/client"),
      "@server": path.resolve(currentDir, "./src/server"),
      "@shared": path.resolve(currentDir, "./src/shared"),
    },
  },
  server: {
    host: Boolean(process.env.SPECV_HOST),
    proxy: {
      "/api": "http://localhost:4649",
    },
  },
  test: {
    environment: "node",
    exclude: ["e2e/**", "node_modules/**", ".worktrees/**"],
    globals: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/client/components/ui/**",
        "src/client/main.tsx",
        "src/server/cli.ts",
        "src/shared/types.ts",
        "src/**/__tests__/**",
        "src/**/*.d.ts",
      ],
      reporter: ["text"],
      reportsDirectory: "coverage",
    },
  },
});
