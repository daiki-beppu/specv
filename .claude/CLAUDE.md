# specv

ローカル Markdown プレビューツール（GitHub スタイルレンダリング）。

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Hono + @hono/node-server
- **Test**: Vitest (unit) + Playwright (E2E)
- **Lint**: Ultracite (Oxlint + Oxfmt) + Knip
- **Git hooks**: lefthook (pre-commit: ultracite + knip)

## Commands

```bash
nr dev:client        # Vite dev server (localhost:5173)
nr dev:server        # API server (localhost:4649)
nr build             # Build client + server
nr test              # Unit tests (Vitest)
nr test:e2e          # E2E tests (Playwright, requires build first)
nr typecheck         # TypeScript type check
nr check             # Lint check (ultracite)
nr fix               # Auto-fix lint issues (ultracite)
```

## Architecture

```
src/
├── client/           # React frontend
│   ├── api.ts        # API client (fetch wrapper)
│   ├── components/   # UI components (file-tree, preview, quick-open)
│   │   ├── ui/       # Base UI components (button)
│   │   ├── source.tsx
│   │   └── theme-toggle.tsx
│   ├── hooks/        # Custom React hooks
│   ├── utils/        # Client utilities (auto-expand, etc.)
│   ├── lib/          # Path resolution utilities
│   ├── main.tsx      # Entry point
│   └── app.tsx       # Main App component
├── server/
│   ├── cli.ts        # CLI entry (Hono + Node server)
│   ├── api.ts        # API routes (/api/files, /api/file, /api/image)
│   ├── files.ts      # scanMarkdownFiles (recursive .md scanner)
│   └── security.ts   # Path traversal protection
├── shared/
│   └── types.ts      # Shared types (FileNode)
tests/                # Unit tests (Vitest)
e2e/                  # E2E tests (Playwright)
```

## Path Aliases

- `@/*` → `src/client/*`
- `@server/*` → `src/server/*`
- `@shared/*` → `src/shared/*`

## Gotchas

- `sort-keys` ルールが有効: オブジェクトキーはアルファベット順に記述すること
- `no-relative-parent-imports` が有効: `../` ではなくパスエイリアスを使う
- E2E テストは `nr build` 後に実行する必要がある（ビルド済みサーバーを使用）
- `empty-dir/` や `.md` を含まないディレクトリは `scanMarkdownFiles` が自動除外する
