# specv リネーム + npm 公開準備 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** パッケージ名を `@daiki-beppu/mdv` から `specv` にリネームし、npm 公開可能な状態にする

**Architecture:** パッケージ名・コマンド名・UI テキスト・localStorage キーをすべて `specv` に統一。クライアント専用の dependencies を devDependencies に移動し、npm install 時の不要な依存を排除する。

**Tech Stack:** pnpm, tsup (server bundle), vite (client bundle)

---

## Task 1: package.json のリネームと依存整理

**Files:**

- Modify: `package.json`

- [ ] **Step 1: パッケージ名・bin・description を変更**

```jsonc
// before
"name": "@daiki-beppu/mdv",
"description": "Local Markdown preview with GitHub-style rendering",
"bin": { "mdv": "./dist/server/cli.js" },

// after
"name": "specv",
"description": "Local Markdown preview with GitHub-style rendering",
"bin": { "specv": "./dist/server/cli.js" },
```

- [ ] **Step 2: クライアント専用パッケージを devDependencies に移動**

`tsup` がサーバーコードをバンドルし、`vite build` がクライアントをバンドルするため、実行時に必要な dependency は `open` のみ（動的 import）。

以下を `dependencies` → `devDependencies` に移動:

- `@base-ui/react`
- `@tanstack/react-hotkeys`
- `class-variance-authority`
- `clsx`
- `fzf`
- `lucide-react`
- `prism-react-renderer`
- `react`
- `react-dom`
- `react-markdown`
- `remark-gfm`
- `shadcn`
- `tailwind-merge`
- `tw-animate-css`

`dependencies` に残すもの（`tsup` が外部 import のまま残すため）:

- `commander` (CLI 引数パーサー)
- `express` (HTTP サーバー)
- `open` (動的 import でブラウザ起動)

- [ ] **Step 3: 動作確認**

Run: `nr build`
Expected: ビルド成功

---

## Task 2: CLI のリネーム

**Files:**

- Modify: `src/server/cli.ts`

- [ ] **Step 1: コマンド名・ログメッセージを変更**

```typescript
// L17: .name("mdv") → .name("specv")
// L38: console.log(`mdv running at ${url}`) → console.log(`specv running at ${url}`)
```

- [ ] **Step 2: 動作確認**

Run: `nr dev:server`
Expected: `specv running at http://localhost:4649` と表示される

---

## Task 3: クライアント UI のリネーム

**Files:**

- Modify: `src/client/app.tsx:153`
- Modify: `src/client/hooks/use-theme.tsx:22,33`

- [ ] **Step 1: サイドバーのタイトルを変更**

```tsx
// app.tsx L153
// before: <h1 className="text-lg font-bold mb-4">mdv</h1>
// after:  <h1 className="text-lg font-bold mb-4">specv</h1>
```

- [ ] **Step 2: localStorage キーを変更**

```tsx
// use-theme.tsx L22
// before: localStorage.getItem("mdv-theme")
// after:  localStorage.getItem("specv-theme")

// use-theme.tsx L33
// before: localStorage.setItem("mdv-theme", theme)
// after:  localStorage.setItem("specv-theme", theme)
```

---

## Task 4: ビルド & 公開前検証

- [ ] **Step 1: フルビルド**

Run: `nr build`
Expected: `dist/server/cli.js` と `dist/client/` が生成される

- [ ] **Step 2: ビルド成果物を確認**

Run: `grep -n "specv" dist/server/cli.js`
Expected: `specv` が含まれ、`mdv` が含まれない

- [ ] **Step 3: テスト実行**

Run: `nr test`
Expected: 全テスト PASS

- [ ] **Step 4: パッケージ内容を dry-run で確認**

Run: `pnpm pack --dry-run`
Expected: `dist/` 配下のファイルのみ含まれる。`node_modules`, `src/` は含まれない

- [ ] **Step 5: コミット**

```bash
git add package.json src/server/cli.ts src/client/app.tsx src/client/hooks/use-theme.tsx
git commit -m "feat!: mdv から specv にリネーム、npm 公開準備"
```

---

## Task 5: npm 公開

- [ ] **Step 1: npm にログイン確認**

Run: `npm whoami`
Expected: ユーザー名が表示される（未ログインなら `npm login` を実行）

- [ ] **Step 2: 公開**

Run: `pnpm publish --access public`
Expected: `specv@0.1.0` が公開される

- [ ] **Step 3: インストール確認**

Run: `npx specv --version`
Expected: `0.1.0`
