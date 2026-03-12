# mdv Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `npx mdv` でカレントディレクトリの Markdown ファイルを GitHub 風にブラウザプレビューする CLI ツールを作る

**Architecture:** Express サーバーが API（ファイルツリー・ファイル内容）を提供し、Vite でビルドした React SPA を静的配信する。CLI は commander で引数をパースし、サーバー起動後にブラウザを自動で開く。

**Tech Stack:** React 19, Vite 8, TypeScript, Tailwind CSS, Express, commander, react-markdown, remark-gfm, prism-react-renderer, github-markdown-css

**Spec:** `docs/superpowers/specs/2026-03-12-mdv-design.md`

---

## File Structure

```
mdv/
├── package.json
├── tsconfig.json              # クライアント用 (Vite が使用)
├── tsconfig.server.json       # サーバー用 (tsup が使用)
├── vite.config.ts
├── index.html                 # Vite SPA エントリ
├── src/
│   ├── shared/
│   │   └── types.ts           # FileNode 型定義 (サーバー・クライアント共有)
│   ├── server/
│   │   ├── cli.ts             # CLI エントリポイント (commander + express + open)
│   │   ├── api.ts             # Express ルートハンドラ (/api/files, /api/file)
│   │   ├── files.ts           # .md ファイルツリー走査ロジック
│   │   └── security.ts        # パストラバーサル検証
│   └── client/
│       ├── main.tsx           # React エントリ
│       ├── App.tsx            # レイアウト (サイドバー + メイン)
│       ├── api.ts             # fetch ラッパー
│       ├── index.css          # Tailwind + github-markdown-css
│       ├── components/
│       │   ├── FileTree.tsx   # 左サイドバーのファイルツリー
│       │   ├── Preview.tsx    # react-markdown レンダリング
│       │   ├── Source.tsx     # prism-react-renderer ソース表示
│       │   └── ThemeToggle.tsx# ダーク/ライト切替ボタン
│       └── hooks/
│           └── useTheme.ts    # テーマ状態管理 (OS追従 + localStorage)
├── tests/
│   ├── files.test.ts          # ファイルツリー走査テスト
│   └── security.test.ts       # パストラバーサルテスト
└── dist/                      # ビルド出力 (git 管理外)
```

---

## Chunk 1: プロジェクト基盤 + サーバー

### Task 1: プロジェクトスキャフォールド

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.server.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `.gitignore`

- [ ] **Step 1: package.json を作成**

```bash
cd ~/01-dev/mdv
pnpm init
```

package.json を以下の内容に編集:

```json
{
  "name": "mdv",
  "version": "0.1.0",
  "description": "Local Markdown preview with GitHub-style rendering",
  "type": "module",
  "bin": {
    "mdv": "./dist/server/cli.js"
  },
  "scripts": {
    "dev:client": "vite",
    "dev:server": "tsx src/server/cli.ts",
    "build:client": "vite build",
    "build:server": "tsup src/server/cli.ts --format esm --out-dir dist/server --dts",
    "build": "pnpm build:client && pnpm build:server",
    "test": "vitest run",
    "prepublishOnly": "pnpm build"
  },
  "files": [
    "dist/"
  ],
  "keywords": ["markdown", "preview", "cli"],
  "license": "MIT"
}
```

- [ ] **Step 2: 依存関係をインストール**

```bash
cd ~/01-dev/mdv
pnpm add react react-dom react-markdown remark-gfm prism-react-renderer github-markdown-css express commander open
pnpm add -D typescript @types/react @types/react-dom @types/express @vitejs/plugin-react vite tailwindcss @tailwindcss/vite tsup tsx vitest
```

- [ ] **Step 3: TypeScript 設定を作成**

`tsconfig.json` (クライアント用):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src/client"]
}
```

`tsconfig.server.json` (サーバー用):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist/server",
    "rootDir": "src/server"
  },
  "include": ["src/server"]
}
```

- [ ] **Step 4: Vite 設定を作成**

`vite.config.ts` (Tailwind v4 は Vite プラグインとして統合、PostCSS 設定不要):
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist/client",
  },
  server: {
    proxy: {
      "/api": "http://localhost:4649",
    },
  },
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 5: index.html を作成**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>mdv</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/client/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: .gitignore を作成**

```
node_modules/
dist/
```

- [ ] **Step 7: 共有型ファイルを作成**

`src/shared/types.ts`:
```ts
export interface FileNode {
  path: string;
  name: string;
  children?: FileNode[];
}
```

- [ ] **Step 8: コミット**

```bash
git add -A
git commit -m "chore: プロジェクトスキャフォールド (React + Vite 8 + Tailwind)"
```

---

### Task 2: セキュリティユーティリティ (TDD)

**Files:**
- Create: `src/server/security.ts`
- Create: `tests/security.test.ts`

- [ ] **Step 1: テストを書く**

`tests/security.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import path from "node:path";
import { validatePath } from "../src/server/security.js";

const baseDir = "/home/user/project";

describe("validatePath", () => {
  it("正常な相対パスを許可する", () => {
    expect(validatePath("README.md", baseDir)).toBe(
      path.join(baseDir, "README.md"),
    );
  });

  it("ネストされたパスを許可する", () => {
    expect(validatePath("docs/guide.md", baseDir)).toBe(
      path.join(baseDir, "docs/guide.md"),
    );
  });

  it(".. を含むパスを拒否する", () => {
    expect(() => validatePath("../etc/passwd", baseDir)).toThrow();
  });

  it("URL エンコードされたトラバーサルを拒否する", () => {
    expect(() => validatePath("%2e%2e/etc/passwd", baseDir)).toThrow();
  });

  it("絶対パスを拒否する", () => {
    expect(() => validatePath("/etc/passwd", baseDir)).toThrow();
  });

  it(".md 以外の拡張子を拒否する", () => {
    expect(() => validatePath("secret.env", baseDir)).toThrow();
  });

  it(".md 拡張子のファイルを許可する", () => {
    expect(validatePath("CHANGELOG.md", baseDir)).toBe(
      path.join(baseDir, "CHANGELOG.md"),
    );
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
cd ~/01-dev/mdv && pnpm test -- tests/security.test.ts
```
Expected: FAIL — `validatePath` が存在しない

- [ ] **Step 3: 実装を書く**

`src/server/security.ts`:
```ts
import path from "node:path";

export function validatePath(filePath: string, baseDir: string): string {
  const decoded = decodeURIComponent(filePath);
  const resolved = path.resolve(baseDir, decoded);

  if (!resolved.startsWith(baseDir + path.sep) && resolved !== baseDir) {
    throw new Error(`Path traversal detected: ${filePath}`);
  }

  if (!resolved.endsWith(".md")) {
    throw new Error(`Only .md files are allowed: ${filePath}`);
  }

  return resolved;
}
```

- [ ] **Step 4: テストが通ることを確認**

```bash
cd ~/01-dev/mdv && pnpm test -- tests/security.test.ts
```
Expected: ALL PASS

- [ ] **Step 5: コミット**

```bash
git add src/server/security.ts tests/security.test.ts
git commit -m "feat: パストラバーサル検証ユーティリティを追加"
```

---

### Task 3: ファイルツリー走査 (TDD)

**Files:**
- Create: `src/server/files.ts`
- Create: `tests/files.test.ts`

- [ ] **Step 1: テストを書く**

`tests/files.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { scanMarkdownFiles } from "../src/server/files.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mdv-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
});

function createFile(relativePath: string, content = "") {
  const fullPath = path.join(tmpDir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

describe("scanMarkdownFiles", () => {
  it("ルートの .md ファイルを返す", async () => {
    createFile("README.md", "# Hello");
    createFile("CHANGELOG.md", "# Changes");

    const result = await scanMarkdownFiles(tmpDir);
    const names = result.map((f) => f.name);
    expect(names).toContain("README.md");
    expect(names).toContain("CHANGELOG.md");
  });

  it("ネストされたディレクトリの .md を返す", async () => {
    createFile("docs/guide.md", "# Guide");

    const result = await scanMarkdownFiles(tmpDir);
    const docsDir = result.find((f) => f.name === "docs");
    expect(docsDir?.children).toHaveLength(1);
    expect(docsDir?.children?.[0].name).toBe("guide.md");
  });

  it(".md 以外のファイルを除外する", async () => {
    createFile("README.md", "# Hello");
    createFile("index.ts", "export {}");

    const result = await scanMarkdownFiles(tmpDir);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("README.md");
  });

  it("node_modules を除外する", async () => {
    createFile("README.md", "# Hello");
    createFile("node_modules/pkg/README.md", "# Pkg");

    const result = await scanMarkdownFiles(tmpDir);
    expect(result).toHaveLength(1);
  });

  it(".git を除外する", async () => {
    createFile("README.md", "# Hello");
    createFile(".git/HEAD", "ref: refs/heads/main");

    const result = await scanMarkdownFiles(tmpDir);
    expect(result).toHaveLength(1);
  });

  it("空ディレクトリの場合は空配列を返す", async () => {
    const result = await scanMarkdownFiles(tmpDir);
    expect(result).toEqual([]);
  });

  it("深度制限（5階層）を超えない", async () => {
    createFile("a/b/c/d/e/f/deep.md", "# Deep");

    const result = await scanMarkdownFiles(tmpDir);
    // 5階層以内のディレクトリ構造は見えるが、6階層目のファイルは含まれない
    const findDeep = JSON.stringify(result);
    expect(findDeep).not.toContain("deep.md");
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
cd ~/01-dev/mdv && pnpm test -- tests/files.test.ts
```
Expected: FAIL — `scanMarkdownFiles` が存在しない

- [ ] **Step 3: 実装を書く**

`src/server/files.ts`:
```ts
import fs from "node:fs/promises";
import path from "node:path";
import type { FileNode } from "../shared/types.js";

export type { FileNode };

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".hg",
  ".svn",
  "__pycache__",
  ".next",
  ".nuxt",
]);

const MAX_DEPTH = 5;

export async function scanMarkdownFiles(
  baseDir: string,
  relativePath = "",
  depth = 0,
): Promise<FileNode[]> {
  if (depth >= MAX_DEPTH) return [];

  const fullPath = path.join(baseDir, relativePath);
  const entries = await fs.readdir(fullPath, { withFileTypes: true });
  const result: FileNode[] = [];

  const sorted = entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const entry of sorted) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;

      const children = await scanMarkdownFiles(
        baseDir,
        path.join(relativePath, entry.name),
        depth + 1,
      );

      if (children.length > 0) {
        result.push({
          path: path.join(relativePath, entry.name),
          name: entry.name,
          children,
        });
      }
    } else if (entry.name.endsWith(".md")) {
      result.push({
        path: path.join(relativePath, entry.name),
        name: entry.name,
      });
    }
  }

  return result;
}
```

- [ ] **Step 4: テストが通ることを確認**

```bash
cd ~/01-dev/mdv && pnpm test -- tests/files.test.ts
```
Expected: ALL PASS

- [ ] **Step 5: コミット**

```bash
git add src/server/files.ts tests/files.test.ts
git commit -m "feat: .md ファイルツリー走査ユーティリティを追加"
```

---

### Task 4: Express API + CLI エントリ

**Files:**
- Create: `src/server/api.ts`
- Create: `src/server/cli.ts`

- [ ] **Step 1: API ルートハンドラを実装**

`src/server/api.ts`:
```ts
import { Router } from "express";
import fs from "node:fs/promises";
import { scanMarkdownFiles } from "./files.js";
import { validatePath } from "./security.js";

export function createApiRouter(baseDir: string): Router {
  const router = Router();

  router.get("/api/files", async (_req, res) => {
    try {
      const files = await scanMarkdownFiles(baseDir);
      res.json({ files });
    } catch (error) {
      res.status(500).json({ error: "Failed to scan files" });
    }
  });

  router.get("/api/file", async (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) {
      res.status(400).json({ error: "path query parameter is required" });
      return;
    }

    try {
      const resolvedPath = validatePath(filePath, baseDir);
      const content = await fs.readFile(resolvedPath, "utf-8");
      res.type("text/plain; charset=utf-8").send(content);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("traversal") || error.message.includes("Only .md")) {
          res.status(400).json({ error: error.message });
          return;
        }
      }
      res.status(404).json({ error: "File not found" });
    }
  });

  return router;
}
```

- [ ] **Step 2: CLI エントリポイントを実装**

`src/server/cli.ts`:
```ts
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
    app.get("*", (_req, res) => {
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
```

- [ ] **Step 3: サーバーが起動することを手動確認**

```bash
cd ~/01-dev/mdv && pnpm dev:server
```
Expected: `mdv running at http://localhost:4649` と表示される（Ctrl+C で停止）

- [ ] **Step 4: コミット**

```bash
git add src/server/api.ts src/server/cli.ts
git commit -m "feat: Express API + CLI エントリポイントを追加"
```

---

## Chunk 2: React フロントエンド

### Task 5: React エントリ + レイアウト

**Files:**
- Create: `src/client/main.tsx`
- Create: `src/client/App.tsx`
- Create: `src/client/api.ts`
- Create: `src/client/index.css`

- [ ] **Step 1: CSS エントリを作成**

`src/client/index.css`:
```css
@import "tailwindcss";
@import "github-markdown-css/github-markdown-light.css" (prefers-color-scheme: light);
@import "github-markdown-css/github-markdown-dark.css" (prefers-color-scheme: dark);

/* Manual dark mode toggle support */
:root:not(.dark) .markdown-body {
  color-scheme: light;
}
.dark .markdown-body {
  color-scheme: dark;
  --bgColor-default: transparent;
}
```

- [ ] **Step 2: API クライアントを実装**

`src/client/api.ts`:
```ts
import type { FileNode } from "../shared/types.js";

export async function fetchFiles(): Promise<FileNode[]> {
  const res = await fetch("/api/files");
  const data = await res.json();
  return data.files;
}

export async function fetchFile(path: string): Promise<string> {
  const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(`Failed to fetch: ${path}`);
  return res.text();
}
```

- [ ] **Step 3: App コンポーネントを実装**

`src/client/App.tsx`:
```tsx
import { useState, useEffect } from "react";
import type { FileNode } from "../shared/types.js";
import { fetchFiles, fetchFile } from "./api.js";
import { FileTree } from "./components/FileTree.js";
import { Preview } from "./components/Preview.js";
import { Source } from "./components/Source.js";
import { ThemeToggle } from "./components/ThemeToggle.js";

type ViewMode = "preview" | "source";

export function App() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");

  useEffect(() => {
    fetchFiles().then((f) => {
      setFiles(f);
      // 最初のファイルを自動選択
      const first = findFirstFile(f);
      if (first) setSelectedPath(first);
    });
  }, []);

  useEffect(() => {
    if (!selectedPath) return;
    fetchFile(selectedPath).then(setContent);
  }, [selectedPath]);

  return (
    <div className="flex h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {/* サイドバー */}
      <aside className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4">
        <h1 className="text-lg font-bold mb-4">mdv</h1>
        <FileTree
          files={files}
          selectedPath={selectedPath}
          onSelect={setSelectedPath}
        />
      </aside>

      {/* メインエリア */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <header className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
          <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
            <button
              className={`px-3 py-1 text-sm ${viewMode === "preview" ? "bg-blue-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              onClick={() => setViewMode("preview")}
            >
              Preview
            </button>
            <button
              className={`px-3 py-1 text-sm ${viewMode === "source" ? "bg-blue-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              onClick={() => setViewMode("source")}
            >
              Source
            </button>
          </div>
          <div className="flex-1" />
          <span className="text-sm text-gray-500">{selectedPath}</span>
          <ThemeToggle />
        </header>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-8">
          {selectedPath ? (
            viewMode === "preview" ? (
              <Preview content={content} />
            ) : (
              <Source content={content} />
            )
          ) : (
            <p className="text-gray-400">ファイルを選択してください</p>
          )}
        </div>
      </main>
    </div>
  );
}

function findFirstFile(files: FileNode[]): string | null {
  for (const f of files) {
    if (!f.children) return f.path;
    const child = findFirstFile(f.children);
    if (child) return child;
  }
  return null;
}
```

- [ ] **Step 4: React エントリを作成**

`src/client/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 5: コミット**

```bash
git add src/client/main.tsx src/client/App.tsx src/client/api.ts src/client/index.css
git commit -m "feat: React エントリ + App レイアウトを追加"
```

---

### Task 6: FileTree コンポーネント

**Files:**
- Create: `src/client/components/FileTree.tsx`

- [ ] **Step 1: FileTree を実装**

`src/client/components/FileTree.tsx`:
```tsx
import { useState } from "react";
import type { FileNode } from "../../shared/types.js";

interface FileTreeProps {
  files: FileNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

export function FileTree({ files, selectedPath, onSelect }: FileTreeProps) {
  return (
    <ul className="space-y-0.5">
      {files.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

function TreeNode({
  node,
  selectedPath,
  onSelect,
}: {
  node: FileNode;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isDir = !!node.children;
  const isSelected = node.path === selectedPath;

  if (isDir) {
    return (
      <li>
        <button
          className="flex items-center gap-1 w-full text-left py-0.5 px-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="text-xs">{expanded ? "▼" : "▶"}</span>
          <span>📁 {node.name}</span>
        </button>
        {expanded && node.children && (
          <ul className="ml-3 space-y-0.5">
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                selectedPath={selectedPath}
                onSelect={onSelect}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <button
        className={`flex items-center gap-1 w-full text-left py-0.5 px-1 rounded text-sm ${
          isSelected
            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
        onClick={() => onSelect(node.path)}
      >
        <span>📄 {node.name}</span>
      </button>
    </li>
  );
}
```

- [ ] **Step 2: コミット**

```bash
git add src/client/components/FileTree.tsx
git commit -m "feat: FileTree コンポーネントを追加"
```

---

### Task 7: Preview コンポーネント

**Files:**
- Create: `src/client/components/Preview.tsx`

- [ ] **Step 1: Preview を実装**

`src/client/components/Preview.tsx`:
```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PreviewProps {
  content: string;
}

export function Preview({ content }: PreviewProps) {
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 2: コミット**

```bash
git add src/client/components/Preview.tsx
git commit -m "feat: Preview コンポーネント (react-markdown + remark-gfm) を追加"
```

---

### Task 8: Source コンポーネント

**Files:**
- Create: `src/client/components/Source.tsx`

- [ ] **Step 1: Source を実装**

`src/client/components/Source.tsx`:
```tsx
import { Highlight, themes } from "prism-react-renderer";
import { useTheme } from "../hooks/useTheme.js";

interface SourceProps {
  content: string;
}

export function Source({ content }: SourceProps) {
  const { theme } = useTheme();
  const prismTheme = theme === "dark" ? themes.vsDark : themes.github;

  return (
    <Highlight theme={prismTheme} code={content} language="markdown">
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={`${className} p-4 rounded-lg overflow-x-auto text-sm`}
          style={style}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              <span className="inline-block w-8 text-right mr-4 text-gray-400 select-none">
                {i + 1}
              </span>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}
```

- [ ] **Step 2: コミット**

```bash
git add src/client/components/Source.tsx
git commit -m "feat: Source コンポーネント (prism-react-renderer) を追加"
```

---

### Task 9: テーマ切替

**Files:**
- Create: `src/client/hooks/useTheme.ts`
- Create: `src/client/components/ThemeToggle.tsx`

- [ ] **Step 1: useTheme フックを実装**

`src/client/hooks/useTheme.ts`:
```ts
import { useState, useEffect } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("mdv-theme") as Theme | null;
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("mdv-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return { theme, toggle };
}
```

- [ ] **Step 2: ThemeToggle コンポーネントを実装**

`src/client/components/ThemeToggle.tsx`:
```tsx
import { useTheme } from "../hooks/useTheme.js";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
```

- [ ] **Step 3: コミット**

```bash
git add src/client/hooks/useTheme.ts src/client/components/ThemeToggle.tsx
git commit -m "feat: ダーク/ライトモード切替を追加"
```

---

## Chunk 3: ビルド・統合

### Task 10: ビルドパイプライン + 動作確認

**Files:**
- Modify: `package.json` (必要に応じて調整)

- [ ] **Step 1: クライアントをビルド**

```bash
cd ~/01-dev/mdv && pnpm build:client
```
Expected: `dist/client/` にビルド出力

- [ ] **Step 2: サーバーをビルド**

```bash
cd ~/01-dev/mdv && pnpm build:server
```
Expected: `dist/server/cli.js` が生成

- [ ] **Step 3: ビルド済みバイナリで動作確認**

```bash
cd ~/01-dev/mdv && node dist/server/cli.js
```
Expected: ブラウザが開き、mdv リポジトリ内の .md ファイルが表示される

- [ ] **Step 4: 他のプロジェクトで動作確認**

```bash
cd ~/01-dev/dotfiles && node ~/01-dev/mdv/dist/server/cli.js
```
Expected: dotfiles リポジトリの .md ファイルが表示される

- [ ] **Step 5: ビルド出力を .gitignore に追加済みか確認、最終コミット**

```bash
cd ~/01-dev/mdv
git add -A
git commit -m "feat: ビルドパイプライン完成、v0.1.0 動作確認"
```
