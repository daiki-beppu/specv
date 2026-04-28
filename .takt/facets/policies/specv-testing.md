# specv テスト設計規約

specv のテスト設計に関する **SSOT (Single Source of Truth)**。Unit (Vitest) / E2E (Playwright) の責務分担、テストケース区分（Happy / Edge / Error）、AAA パターン、`tests/test-utils.ts` のヘルパー活用基準を定める。

## 参照元

- **Claude Code セッション**: `.claude/CLAUDE.md` から `@.takt/facets/policies/specv-testing.md` で import される。
- **takt step**: `test_design` / `test_design_review` / `test_design_fix` / `write_tests` / `write_tests_review` / `write_tests_fix` の `policy` リストに含まれる。
- **人間レビュー**: 規約準拠の判定基準として参照する。

## Unit / E2E 判定基準

| 基準              | Unit (Vitest)                       | E2E (Playwright)                     |
| ----------------- | ----------------------------------- | ------------------------------------ |
| 主目的            | 単一関数 / モジュールの振る舞い検証 | ユーザー導線・統合の検証             |
| DOM / Browser     | 不要、または jsdom で完結する範囲   | 実ブラウザでの描画・操作・スクロール |
| ファイル監視・SSE | モックで代替可能なロジック単体      | サーバー稼働下での実通信             |
| 配置先            | `tests/**.test.ts(x)`               | `e2e/**.test.ts`                     |
| 実行コマンド      | `nr test`                           | `nr build` 後に `nr test:e2e`        |

```text
# REJECT - 純粋ロジックを E2E で検証（過剰結合 / コスト超過）
e2e/path-utils.test.ts (純粋関数のテスト)

# REJECT - DOM 描画を Unit で検証（検証不能）
tests/preview-rendering.test.tsx で実ブラウザの描画ピクセル検証

# OK - Unit でロジック、E2E で結合
tests/files.test.ts            # scanMarkdownFiles の純粋ロジック
e2e/navigation.test.ts         # サイドバー → プレビュー遷移の結合
```

両方で検証する場合は両方の行を立て、根拠欄に「Unit でロジック、E2E で結合」と明示する。

## テストケース区分（Happy / Edge / Error）

| 区分  | 定義                                          | 典型例                                    |
| ----- | --------------------------------------------- | ----------------------------------------- |
| Happy | 正常系の代表ケース（仕様の中核を 1 行で示す） | 既定入力で期待結果が返る                  |
| Edge  | 境界値・極小・極大・空・並行・状態遷移        | 空入力 / 上限値 / 連続呼び出し / 未初期化 |
| Error | 不正入力・例外パス・拒否されるべき入力        | 不正型 / パス traversal / 権限なし        |

### 区分の運用

- **1 行 1 ケース**: 複合ケースは分割する。1 つの it で複数振る舞いを検証しない。
- **既存のディレクトリ慣習**: ファイル名は `*.test.ts(x)`。describe / it の命名規約は後述の AAA セクションに従う。

```typescript
// REJECT - 複合ケース
it("scanMarkdownFiles: 通常 .md を返し空ディレクトリを除外し node_modules も除外する", () => { ... });

// OK - 1 行 1 ケース
it(".md ファイルのみを返す", () => { ... });
it(".md を含まないディレクトリを除外する", () => { ... });
it("node_modules を除外する", () => { ... });
```

## AAA パターン採用方針

specv では **AAA (Arrange / Act / Assert) を必須**とする。**Given-When-Then は不採用**。

| 項目                          | 方針                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------- |
| Arrange / Act / Assert 区切り | 必須。Act / Assert の境界が曖昧な場合は空行 or コメントで区切る              |
| `// Arrange` 等のコメント     | 必須ではない。可読性向上のために任意で付与可                                 |
| Given-When-Then               | 採用しない（既存テスト群との統一を優先）                                     |
| describe ブロック             | 関数参照 (`describe(scanMarkdownFiles, ...)`) または `describe("Component")` |
| it タイトル                   | 日本語。期待振る舞いを 1 行で記述                                            |

```typescript
// OK - AAA 構造（コメントなし、空行区切り、推奨ヘルパー withTmpDir 使用）
it(".md ファイルのみを返す", async () => {
  await withTmpDir(async (tmpDir) => {
    createFile(tmpDir, "README.md", "# Hello");
    createFile(tmpDir, "index.ts", "export {}");

    const result = await scanMarkdownFiles(tmpDir);

    expect(result).toEqual([
      { name: "README.md", path: "README.md", type: "file" },
    ]);
  });
});
```

## `tests/test-utils.ts` ヘルパー活用ガイド

`tests/test-utils.ts` の 5 関数を活用し、ファイルシステム fixture と非同期待機の重複を排除する。

| 関数                                   | 用途                                                                        |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `createTmpDir()`                       | `os.tmpdir()` 配下に `specv-test-*` を作成、realpath を返す                 |
| `removeTmpDir(dir)`                    | 指定ディレクトリを `recursive: true` で削除                                 |
| `createFile(tmpDir, relPath, content)` | 親ディレクトリ自動作成付きでファイル書き込み                                |
| `withTmpDir(async (dir) => { ... })`   | try/finally でクリーンアップ自動化（**推奨**）                              |
| `delay`                                | `node:timers/promises` の `setTimeout` 再エクスポート（watcher 系の待機用） |

### 使い分け

- **単発の fixture**: `withTmpDir` を使う（クリーンアップ自動化）。
- **複数 it で fixture を共有**: `beforeEach` / `afterEach` で `createTmpDir` / `removeTmpDir` を呼ぶ。
- **非同期 watcher の確定待ち**: `delay(100)` 程度で OS のファイル監視イベント伝播を待つ（既存 `tests/watcher.test.ts` 準拠）。

### 推奨パターン

```typescript
// 単発: withTmpDir
it("ファイル変更が検知される", async () => {
  await withTmpDir(async (tmpDir) => {
    createFile(tmpDir, "README.md", "# Hello");
    const watcher = startWatcher(tmpDir);

    createFile(tmpDir, "README.md", "# Updated");
    await delay(100);

    expect(watcher.events).toContainEqual({
      type: "change",
      path: "README.md",
    });
  });
});

// 複数共有: beforeEach / afterEach
describe(scanMarkdownFiles, () => {
  let tmpDir: string;
  beforeEach(() => {
    tmpDir = createTmpDir();
  });
  afterEach(() => {
    removeTmpDir(tmpDir);
  });

  it(".md ファイルのみを返す", () => {
    /* ... */
  });
  it("node_modules を除外する", () => {
    /* ... */
  });
});
```

## スコープ外

本規約は以下を扱わない。別 issue / 別ドキュメントで管理する。

- 既存テストの遡及修正（区分・命名の書き換え） — issue #65-B / #65-C / #65-D
- カバレッジ目標値・カバレッジ計測ツール導入 — issue #65 系
- CI / GitHub Actions 連携 — 別途検討
- `tests/test-utils.ts` のヘルパー追加・改修 — 必要に応じて別 PR
