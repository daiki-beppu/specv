import { isObjectRecord } from "@shared/is-object-record";

// 再発防止: object narrow ロジック（typeof === "object" && !== null && !Array.isArray）が
// 兄弟モジュールに別実装で散らばらないよう、`isObjectRecord` を単一の SSOT として扱う。
// 関連 architect-review:
//   - ARCH-NEW-shared-errors-record-narrow-inconsistency
//     (`src/shared/errors.ts` の inline 展開を SSOT に集約)
//   - ARCH-NEW-remark-frontmatter-table-is-record-dup
//     (`src/client/lib/remark-frontmatter-table.ts:isRecord` および
//      `src/server/cli.ts:isPkgShape` 内 inline 同条件式を SSOT に集約)
// dry-violation family_tag の再発防止としてヘルパーの境界仕様をここで固定する。
// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(isObjectRecord, () => {
  it("プレーンオブジェクトに対して true を返す", () => {
    expect(isObjectRecord({})).toBe(true);
    expect(isObjectRecord({ a: 1 })).toBe(true);
  });

  it.each([
    { input: null, label: "null" },
    { input: undefined, label: "undefined" },
    { input: 0, label: "number" },
    { input: "", label: "string" },
    { input: true, label: "boolean" },
    { input: [], label: "array" },
    { input: [1, 2], label: "non-empty array" },
  ])("$label に対して false を返す", ({ input }) => {
    expect(isObjectRecord(input)).toBe(false);
  });

  // 型述語による narrow の compile-time 保証は、本ヘルパーを利用する
  // `src/shared/{errors,types}.ts` / `src/client/lib/remark-frontmatter-table.ts` /
  // `src/server/cli.ts` および各種テスト側で実証されている。
  // ここでは runtime の boolean 契約のみを固定する。
});
