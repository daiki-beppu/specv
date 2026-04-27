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
├── client/           # React frontend
│   ├── api.ts        # API client (fetch wrapper)
│   ├── components/   # UI components (file-tree, preview, quick-open)
│   │   ├── ui/       # Base UI components (button)
│   │   ├── mermaid-block.tsx  # Mermaid diagram renderer (lazy loaded)
│   │   ├── source.tsx
│   │   └── theme-toggle.tsx
│   ├── hooks/        # Custom React hooks
│   ├── utils/        # Client utilities (auto-expand, etc.)
│   ├── lib/          # Path resolution utilities
│   ├── main.tsx      # Entry point
│   └── app.tsx       # Main App component
├── server/
│   ├── cli.ts        # CLI entry (Hono + Node server)
│   ├── api.ts        # API routes (/api/files, /api/file, /api/image, /api/watch)
│   ├── files.ts      # scanMarkdownFiles (recursive .md scanner)
│   ├── security.ts   # Path traversal protection
│   └── watcher.ts    # File watcher (hot reload)
├── shared/
│   └── types.ts      # Shared types (FileNode)
tests/                # Unit tests (Vitest)
e2e/                  # E2E tests (Playwright)
fixtures/             # Manual testing markdown files
```

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

# takt（AI 開発ループ）

[takt](https://github.com/nrslib/takt) で issue → 計画 → テスト → 実装 → AIレビュー → 並列レビュー の開発ループを駆動する。

## 主要コマンド

```bash
takt prompt default            # default workflow のプロンプトを目視確認
takt workflow doctor default   # workflow 定義の静的検証
takt -i <issue 番号>            # 対話モードで issue を実装
takt -i <issue 番号> --auto-pr --draft  # 完了後にドラフト PR を自動作成
```

## 構成

- `.takt/config.yaml` — プロジェクト固有のオーバーライド（`draft_pr: true` のみ）
- `.takt/workflows/default.yaml` — builtin の `default` を eject し、各 step に `specv-conventions` policy を追加した独自版
- `.takt/facets/policies/specv-conventions.md` — specv の行動規範（ni 経由実行 / TDD / vp check / パスエイリアス / 日本語 Conventional Commits）
- `.takt/.gitignore` — runtime artifacts (`runs/`, `tasks/`, `tasks.yaml` など) を allowlist 方式で除外。ルート `.gitignore` への追加は不要

## 前提（グローバル設定）

`~/.takt/config.yaml` を dotfiles でシンボリックリンク管理する想定（`~/.claude/CLAUDE.md` と同パターン）。最低限以下が定義されている必要がある:

```yaml
provider: claude
language: ja
```

dotfiles 側のセットアップが終わっていない場合、builtin facet が英語で展開される（specv-conventions は project 側にあるため言語に関係なく機能する）。

## 運用ルール

- 実 issue での試運転は dotfiles のグローバル設定を反映してから行う
- `--auto-pr` は必ず `--draft` 付きで実行する（`draft_pr: true` で既定はドラフト）
- builtin の default workflow を upstream で更新する場合、`.takt/workflows/default.yaml` を再 eject → specv-conventions の追加注入を反映するメンテが必要
- pipeline 実行（CI / GitHub Actions 連携）は今回スコープ外、追って検討
