# specv

ローカル Markdown プレビューツール（GitHub スタイルレンダリング）。

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Hono + @hono/node-server
- **Test**: Vitest (unit) + Playwright (E2E)
- **Lint**: Vite+ (Oxlint + Oxfmt) + Knip
- **Git hooks**: lefthook (pre-commit: vp check + knip + test)

## Commands

```bash
nr dev               # client + server 同時起動
nr dev:client        # Vite dev server (localhost:5173)
nr dev:server        # API server (localhost:4649)
nr build             # Build client + server
nr test              # Unit tests (Vitest)
nr test:coverage     # Unit tests with coverage report
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
│   └── types.ts           # Shared types (FileNode, ApiError, SSE events)
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

## Testing Strategy

### 責務分担

- **ユニットテスト**: 単一コンポーネント内で完結するロジック・状態変化、純粋関数、カスタムフック、API エンドポイント
- **E2E テスト**: 複数コンポーネントの連携、ブラウザ固有 API（focus, scroll, resize）、ページ遷移、レスポンシブ動作

### テスト対象の選定基準

- テストする: 条件分岐・データ変換を持つ関数、副作用を制御するフック、API エンドポイント、セキュリティロジック
- テストしない: shadcn UI コンポーネント（ui/ 配下）、型定義のみのファイル、ライブラリ薄ラッパー（cn.ts 等）、CLI エントリーポイント

### テスト原則

- 振る舞いをテストし、実装詳細をテストしない
- テストのために export を増やさない — テスト可能性が低いなら設計を見直す
- モックは最小限に — テスト対象の直接依存のみモック、間接依存は本物を使う

### テスト命名

- describe: モジュール名 or 関数参照
- it: 日本語で「何が起きるか」を記述
- ネストは最大2段

### モック方針

- Server: 実ファイル操作（withTmpDir）、外部プロセスのみモック
- Client: テスト対象の直接依存のみモック、間接依存はモックしない

### 環境指定

- Server テスト: デフォルト（node）
- Client テスト: ファイル先頭に `// @vitest-environment jsdom`

### カバレッジ

- 数値目標は設けない — カバレッジレポートは「抜け発見ツール」として使う
- `nr test:coverage` でレポート生成

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
