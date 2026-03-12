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
CLI (cac)
  │
  ├── ローカル HTTP サーバー (node:http)
  │     ├── GET /              → SPA (HTML/CSS/JS)
  │     ├── GET /api/files     → .md ファイルツリー (JSON)
  │     └── GET /api/file?path=→ ファイル内容 (raw text)
  │
  └── open (ブラウザ自動起動)

ブラウザ側 (SPA, バンドルなし)
  ├── ファイルツリー (左サイドバー)
  ├── コンテンツエリア (右メイン)
  │     ├── Preview モード: markdown-it でレンダリング
  │     └── Source モード: 生テキスト + シンタックスハイライト
  └── ヘッダー: Preview/Source 切替 + ダーク/ライト トグル
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

| パーツ | ライブラリ | 理由 |
|--------|-----------|------|
| CLI | `cac` | 軽量、TypeScript フレンドリー |
| サーバー | `node:http` | 外部依存ゼロ |
| MD パーサー | `markdown-it` | プラグイン豊富、高速 |
| コードハイライト | `shiki` | VS Code 同等品質のハイライト |
| スタイル | `github-markdown-css` | GitHub と同じ見た目 |
| ブラウザ起動 | `open` | クロスプラットフォーム対応 |

### フロントエンド

- フレームワークなし（Vanilla JS）
- HTML/CSS/JS は JS テンプレートリテラルとしてサーバーコードに埋め込み（単一パッケージで完結）
- markdown-it: npm 依存としてバンドル、サーバー側で HTML に変換して配信
- shiki: サーバー側で実行し、ハイライト済み HTML を返す（WASM のブラウザロード回避）
- github-markdown-css: ビルド時に CSS を文字列として埋め込み

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
      "children": [
        { "path": "docs/guide.md", "name": "guide.md" }
      ]
    }
  ]
}
```

### `GET /api/file?path=<relative-path>`

指定されたファイルの生テキストを返す。

- Content-Type: `text/plain; charset=utf-8`
- パストラバーサル対策: `path.resolve()` 後にベースディレクトリの prefix チェック

### `GET /api/render?path=<relative-path>`

指定されたファイルを markdown-it + shiki でレンダリングした HTML を返す。

- Content-Type: `text/html; charset=utf-8`
- Source モード用にハイライト済み HTML も含む

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
- シンタックスハイライト（shiki、サーバー側レンダリング）
- ダーク/ライトモード（OS 追従 + トグル）
- ブラウザ自動起動
- ポート自動選択（デフォルト 4649、衝突時インクリメント）

## v2（将来）

- ライブリロード（`fs.watch` + WebSocket）
- 単一ファイル指定モード（`npx mdv README.md`）
- TOC（目次）自動生成
- ポート指定オプション（`--port 3000`）
