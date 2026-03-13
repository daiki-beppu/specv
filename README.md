# specv

カレントディレクトリの Markdown ファイルを GitHub 風にブラウザプレビューする CLI ツール。

## Features

- GitHub Flavored Markdown (GFM) レンダリング
- シンタックスハイライト付きコードブロック + コピーボタン
- Preview / Source 切替
- ファイルツリー (サイドバー) + 検索
- VSCode 風 Quick Open (`Cmd+P`) with fzf ファジー検索
- サイドバートグル (`Cmd+B`)
- ダーク / ライトモード切替 (OS 追従 + 手動切替)
- GitHub ダークテーマ準拠の配色
- ポート自動検出 (衝突時に次のポートを試行)

## Install

```bash
npm install -g specv
```

## Usage

```bash
# カレントディレクトリの .md をプレビュー
specv

# ポート指定
specv -p 3000
```

ブラウザが自動で開き、Markdown ファイルを GitHub 風にレンダリング表示します。

## Keyboard Shortcuts

| Shortcut           | Action                    |
| ------------------ | ------------------------- |
| `Cmd+P` / `Ctrl+P` | Quick Open (ファイル検索) |
| `Cmd+B` / `Ctrl+B` | サイドバー開閉            |

## Architecture

```
Hono Server (API) ─── React SPA (Vite build)
  /api/files            FileTree + Preview + Source
  /api/file?path=...    react-markdown + prism-react-renderer
```

- **Server:** Hono + @hono/node-server + commander (CLI)
- **Client:** React 19 + Vite + Tailwind CSS v4
- **Markdown:** react-markdown + remark-gfm
- **Search:** fzf (fuzzy finder) + TanStack Hotkeys
- **Security:** パストラバーサル検証、.md ファイルのみアクセス許可

## Development

```bash
# クライアント開発サーバー (HMR)
pnpm dev:client

# サーバー開発
pnpm dev:server

# テスト
pnpm test

# ビルド
pnpm build
```

## CI/CD

GitHub Actions で自動化:

- **CI** — PR・main push 時に lint / knip / typecheck / test / build を実行
- **Publish** — GitHub Release 作成時に npm publish（Trusted Publishing）

## License

MIT
