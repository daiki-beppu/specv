# specv

ローカル Markdown プレビューツール（GitHub スタイルレンダリング）。

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Hono + @hono/node-server
- **Test**: Vitest (unit) + Playwright (E2E)
- **Lint**: Vite+ (Oxlint + Oxfmt) + Knip
- **Git hooks**: lefthook (pre-commit: vp check + knip)

## Commands

```bash
nr dev               # client + server 同時起動
nr dev:client        # Vite dev server (localhost:5173)
nr dev:server        # API server (localhost:4649)
nr build             # Build client + server
nr test              # Unit tests (Vitest)
nr test:e2e          # E2E tests (Playwright, requires build first)
nr check             # Lint + Format + TypeScript check (vp check)
nr fix               # Auto-fix lint/format issues (vp check --fix)
```

## Architecture

```
src/
├── client/                # React frontend
│   ├── api.ts             # API client (fetch wrapper)
│   ├── components/
│   │   ├── markdown/      # Markdown レンダリング関連
│   │   │   ├── preview.tsx, code-block.tsx, mermaid-block.tsx
│   │   │   ├── markdown-image.tsx, markdown-table.tsx, markdown-pre.tsx, md-link.tsx
│   │   │   ├── markdown-plugins.ts, remark-frontmatter-table.ts, path-utils.ts
│   │   │   └── __tests__/
│   │   ├── ui/            # Base UI components (shadcn)
│   │   ├── file-tree.tsx, quick-open.tsx, source.tsx, theme-toggle.tsx, ...
│   │   └── __tests__/
│   ├── hooks/             # Custom React hooks + watch-handler
│   │   └── __tests__/
│   ├── utils/             # Shared utilities (cn, auto-expand)
│   │   └── __tests__/
│   ├── main.tsx           # Entry point
│   └── app.tsx            # Main App component
├── server/
│   ├── cli.ts             # CLI entry (Hono + Node server)
│   ├── api.ts             # API routes (/api/files, /api/file, /api/image, /api/watch)
│   ├── files.ts           # scanMarkdownFiles (recursive .md scanner)
│   ├── security.ts        # Path traversal protection
│   ├── watcher.ts         # File watcher (hot reload)
│   └── __tests__/
├── shared/
│   └── types.ts           # Shared types (FileNode)
e2e/                       # E2E tests (Playwright)
fixtures/                  # Manual testing markdown files
```

テストはコロケーションパターンで配置。各ディレクトリの `__tests__/` に対応するテストを格納。

## Path Aliases

- `@/*` → `src/client/*`
- `@server/*` → `src/server/*`
- `@shared/*` → `src/shared/*`

## Development Style

- TDD（テスト駆動開発）で実装する: テストを先に書き、Red → Green → Refactor のサイクルで進める

## Gotchas

- `preview.tsx` は remark/rehype プラグインを使用: remarkGfm, remarkMath, remarkAlert, rehypeKatex, rehypeSlug, rehypeAutolinkHeadings
- ブラウザを閉じるとサーバーが自動停止する（SSE `/api/lifecycle` による切断検知）
- `../` ではなくパスエイリアスを使う
- E2E テストは `nr build` 後に実行する必要がある（ビルド済みサーバーを使用）
- `empty-dir/` や `.md` を含まないディレクトリは `scanMarkdownFiles` が自動除外する

# Vite+ (Lint & Format)

Vite+ 内蔵の Oxlint + Oxfmt でコード品質を管理。設定は `vite.config.ts` の `lint` / `fmt` セクションに統合。

- **Check**: `nr check` (= `vp check`)
- **Auto-fix**: `nr fix` (= `vp check --fix`)
