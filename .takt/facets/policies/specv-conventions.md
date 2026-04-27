# specv プロジェクト規約

specv プロジェクトに変更を加えるすべてのエージェントが遵守する行動規範。

## 原則

| 原則                        | 基準                                                        |
| --------------------------- | ----------------------------------------------------------- |
| パッケージマネージャ抽象化  | npm / pnpm / yarn を直接呼ばず ni 経由で実行                |
| TDD                         | テストを先に書き、Red → Green → Refactor のサイクルで進める |
| 単一の品質ゲート            | ローカル品質チェックは vp check（lint + format + 型）で統一 |
| pre-commit を尊重           | lefthook の自動修正・除外ルールに逆らう変更は避ける         |
| パスエイリアス必須          | 相対パスの `../` 連打を避け、エイリアスで参照する           |
| 日本語 Conventional Commits | 規約は日本語表記のメッセージで統一                          |

## コマンド実行

パッケージマネージャを直接呼ばず、抽象化コマンド（ni / nr / nlx）経由で実行する。

| 直接呼び出し                                 | 代替          |
| -------------------------------------------- | ------------- |
| `npm install` / `pnpm install`               | `ni`          |
| `npm install <pkg>` / `pnpm add <pkg>`       | `ni <pkg>`    |
| `npm install -D <pkg>` / `pnpm add -D <pkg>` | `ni -D <pkg>` |
| `npm run <script>` / `pnpm <script>`         | `nr <script>` |
| `npx <cmd>` / `pnpm dlx <cmd>`               | `nlx <cmd>`   |

```bash
# REJECT - パッケージマネージャ直叩き
pnpm install
pnpm run check
npx playwright test

# OK - 抽象化コマンド
ni
nr check
nlx playwright test
```

## TDD（テスト駆動開発）

実装より先にテストを書き、Red → Green → Refactor のサイクルで進める。

| フェーズ | 状態                         | 次の行動         |
| -------- | ---------------------------- | ---------------- |
| Red      | 失敗するテストが書けた       | 最小実装に進む   |
| Green    | テストが通る最小実装が済んだ | リファクタに進む |
| Refactor | 重複・命名・構造を整えた     | 次の Red に戻る  |

```typescript
// REJECT - 実装を先に書いてテストを後付け
export function add(a: number, b: number) {
  return a + b;
}
test("add", () => expect(add(1, 2)).toBe(3));

// OK - 失敗するテストから始める
test("add returns sum", () => expect(add(1, 2)).toBe(3)); // Red
export function add(a: number, b: number) {
  return a + b;
} // Green
```

## コード品質チェック

ローカル検査は vp check（Vite+ 内蔵 Oxlint + Oxfmt + 型チェック）で統一する。

| 用途                   | コマンド                      |
| ---------------------- | ----------------------------- |
| 検査のみ               | `nr check`                    |
| 自動修正               | `nr fix`                      |
| 未使用エクスポート検出 | `nr knip`                     |
| ユニットテスト         | `nr test`                     |
| E2E テスト             | `nr build` 後に `nr test:e2e` |

pre-commit (lefthook) は `vp check --fix` と `knip` を実行する。コミット前にローカルで `nr check` が通る状態にしておくこと。E2E はビルド済みサーバーを使うため、必ず `nr build` を先に走らせる。

## パス参照規約

相対パスのドット連打を避け、設定済みエイリアスで参照する。

| エイリアス  | 対象           |
| ----------- | -------------- |
| `@/*`       | `src/client/*` |
| `@server/*` | `src/server/*` |
| `@shared/*` | `src/shared/*` |

```typescript
// REJECT - 相対パスの深い連打
import { FileNode } from "../../../shared/types";

// OK - エイリアス
import { FileNode } from "@shared/types";
```

## コミットメッセージ

Conventional Commits を日本語の本文で書く。

| 形式       | 内容                                           |
| ---------- | ---------------------------------------------- |
| 1 行目     | `<type>: <日本語の要約>`（72 文字以内目安）    |
| 本文       | 任意。空行をはさんで「なぜ」を日本語で記述     |
| 破壊的変更 | type の直後に `!` を付ける（例: `feat!: ...`） |

利用する type:

| type     | 用途                                 |
| -------- | ------------------------------------ |
| feat     | 新機能                               |
| fix      | バグ修正                             |
| refactor | 振る舞いを変えない構造変更           |
| chore    | ビルド・設定・依存などのメンテナンス |
| docs     | ドキュメントのみの変更               |
| test     | テスト追加・修正                     |
| ci       | CI/CD 設定の変更                     |

```text
# REJECT - 英語、type なし、要約が抽象的
update files

# OK - 日本語、type あり、何をしたかが伝わる
fix: ファイル監視で .md 以外も再読込してしまう問題を修正
```
