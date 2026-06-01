import { isNetworkError } from "@/lib/is-network-error";

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(isNetworkError, () => {
  it('fetch のネットワーク失敗 (TypeError "Failed to fetch") を true と判定する', () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
  });

  it("HTTP エラー由来の Error は false と判定する", () => {
    expect(isNetworkError(new Error("fail"))).toBe(false);
  });

  it("Error 以外の値は false と判定する", () => {
    const undefinedValue: unknown = undefined;
    expect(isNetworkError("string")).toBe(false);
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError(undefinedValue)).toBe(false);
  });
});
