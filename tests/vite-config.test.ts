import { isObjectRecord } from "@shared/is-object-record";

// 動的 import + 非リテラルパスで vite.config.ts の型解決連鎖を断ち切る。
// 静的 import は vite-plugin-qrcode.ts/vite.config.ts の `.ts` 拡張子付き import を
// tsc にカスケード型検査させ TS5097 を引き起こすため使用しない。
const configModulePath = ["..", "vite.config"].join("/");
const configModule: unknown = await import(configModulePath);

if (!isObjectRecord(configModule)) {
  throw new Error("vite.config module is not an object");
}

const configDefault: unknown = configModule.default;

if (!isObjectRecord(configDefault)) {
  throw new Error("vite.config default export is not an object");
}

const lintValue: unknown = configDefault.lint;

if (!isObjectRecord(lintValue)) {
  throw new Error("vite.config lint is not an object");
}

const lintOptions: unknown = lintValue.options;
const typeAware: unknown = isObjectRecord(lintOptions)
  ? lintOptions.typeAware
  : undefined;
const typeCheck: unknown = isObjectRecord(lintOptions)
  ? lintOptions.typeCheck
  : undefined;

describe("vite.config.ts (lint options)", () => {
  it("lint.options がオブジェクトとして存在する", () => {
    expect(isObjectRecord(lintOptions)).toBe(true);
  });

  it("lint.options.typeAware が true に設定されている", () => {
    expect(typeAware).toBe(true);
  });

  it("lint.options.typeCheck が true に設定されている", () => {
    expect(typeCheck).toBe(true);
  });
});
