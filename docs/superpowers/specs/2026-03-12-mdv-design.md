# mdv — ローカル Markdown プレビューツール 設計書

## コンセプト

`npx mdv` でカレントディレクトリの Markdown ファイルを GitHub 風にブラウザでプレビューする CLI ツール。
difit のような洗練された UI で、Preview / Source の切り替えができる。

## ユースケース

- プロジェクトの README やドキュメントをブラウザで確認したい
- GitHub にプッシュする前に見た目を確認したい
- 複数の .md ファイルを横断的に閲覧したい

## アーキテクチャ

```
CLI (commander)
  │
  ├── Express サーバー
  │     ├── GET /              → Vite ビルド済み SPA (dist/)
  │     ├── GET /api/files     → .md ファイルツリー (JSON)
  │     └── GET /api/file?path=→ ファイル内容 (raw text)
  │
  └── open (ブラウザ自動起動)

React SPA (Vite + Tailwind)
  ├── FileTree (左サイドバー)
  ├── ContentArea (右メイン)
  │     ├── Preview: react-markdown + remark-gfm
  │     └── Source: prism-react-renderer
  └── Header: Preview/Source 切替 + ダーク/ライト トグル
```

## 画面構成

```
┌─────────────┬──────────────────────────────┐
│ .md 一覧    │  [Preview] [Source]  [🌙/☀️] │
│             │                              │
│ README.md ● │  # Title                     │
│ CHANGELOG.md│                              │
│ docs/       │  Lorem ipsum dolor sit...    │
│  guide.md   │                              │
│             │  ## Section                  │
│             │  - item 1                    │
│             │  - item 2                    │
└─────────────┴──────────────────────────────┘
```

- **左サイドバー**: ディレクトリ内の .md ファイルをツリー表示（ネストあり）
- **右メインエリア**: 選択されたファイルのプレビューまたはソース
- **ヘッダー**: Preview/Source 切替タブ、ダーク/ライト モードトグル

## 技術スタック

difit と同様の構成を採用。

### サーバー側

| パーツ       | ライブラリ  | 理由                         |
| ------------ | ----------- | ---------------------------- |
| CLI          | `commander` | difit と同じ、定番           |
| サーバー     | `express`   | ルーティング・静的配信が簡潔 |
| ブラウザ起動 | `open`      | クロスプラットフォーム対応   |

### フロントエンド (React SPA)

| パーツ           | ライブラリ                      | 理由                                     |
| ---------------- | ------------------------------- | ---------------------------------------- |
| フレームワーク   | `React 19` + `React DOM`        | コンポーネント分割、状態管理             |
| ビルド           | `Vite 8`                        | 高速ビルド、HMR                          |
| 言語             | `TypeScript`                    | 型安全                                   |
| CSS              | `Tailwind CSS`                  | ユーティリティファースト、difit 同様     |
| Markdown         | `react-markdown` + `remark-gfm` | React コンポーネントとして描画、GFM 対応 |
| コードハイライト | `prism-react-renderer`          | React 統合が楽、軽量                     |
| スタイル         | `github-markdown-css`           | GitHub と同じ見た目                      |

### ビルド・配信方式

- フロントエンドは Vite でビルドし `dist/` に出力
- サーバーが `dist/` を静的ファイルとして配信
- npm publish 時に `dist/` を含める（`prepublishOnly` でビルド）

## API 設計

### `GET /api/files`

ディレクトリ内の .md ファイル一覧をツリー構造で返す。

```json
{
  "files": [
    { "path": "README.md", "name": "README.md" },
    { "path": "CHANGELOG.md", "name": "CHANGELOG.md" },
    {
      "path": "docs",
      "name": "docs",
      "children": [{ "path": "docs/guide.md", "name": "guide.md" }]
    }
  ]
}
```

### `GET /api/file?path=<relative-path>`

指定されたファイルの生テキストを返す。

- Content-Type: `text/plain; charset=utf-8`
- パストラバーサル対策: `path.resolve()` 後にベースディレクトリの prefix チェック

### エラーレスポンス

- `400`: 不正なパス（パストラバーサル検出）
- `404`: ファイルが存在しない
- `500`: サーバーエラー
- 形式: `{ "error": "<メッセージ>" }`

## セキュリティ

- `localhost` (127.0.0.1) のみでリッスン（外部からアクセス不可）
- パストラバーサル防止: `path.resolve()` で正規化後、ベースディレクトリの prefix であることを検証（`..`、URL エンコード、シンボリックリンク対策）
- .md 拡張子のファイルのみ配信

## ダーク/ライトモード

- デフォルト: OS の `prefers-color-scheme` に追従
- トグルボタンで手動切り替え可能
- 選択は `localStorage` に保存

## CLI オプション (v1)

```
Usage: mdv [options]

Options:
  -p, --port <number>  ポート番号 (default: 4649, 使用中なら自動インクリメント)
  -h, --help           ヘルプを表示
  -v, --version        バージョンを表示
```

## ファイルツリー走査ルール

- `.gitignore` に含まれるパスを除外（`node_modules` 等）
- `.git` ディレクトリを除外
- 走査深度: 最大 5 階層
- `.md` 拡張子のファイルのみ表示

## v1 スコープ

- `npx mdv` でカレントディレクトリの .md をプレビュー
- ファイルツリー表示（ネスト対応、.gitignore 準拠）
- GitHub 風レンダリング（github-markdown-css）
- Preview / Source 切替
- シンタックスハイライト（prism-react-renderer）
- ダーク/ライトモード（OS 追従 + トグル）
- ブラウザ自動起動
- ポート自動選択（デフォルト 4649、衝突時インクリメント）

## v2（将来）

- ライブリロード（`fs.watch` + WebSocket）
- 単一ファイル指定モード（`npx mdv README.md`）
- TOC（目次）自動生成
- ポート指定オプション（`--port 3000`）
