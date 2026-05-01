import { isApiErrorResponse } from "@shared/errors";

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(isApiErrorResponse, () => {
  it("error フィールドが string のとき true を返す", () => {
    const value: unknown = { error: "boom" };

    expect(isApiErrorResponse(value)).toBe(true);
  });

  it('error + code "SECURITY" を持つとき true を返す', () => {
    const value: unknown = { code: "SECURITY", error: "x" };

    expect(isApiErrorResponse(value)).toBe(true);
  });

  it("code が undefined でも true を返す", () => {
    const value: unknown = { code: undefined, error: "x" };

    expect(isApiErrorResponse(value)).toBe(true);
  });

  it("空オブジェクトのとき false を返す", () => {
    const value: unknown = {};

    expect(isApiErrorResponse(value)).toBe(false);
  });

  it("error が string でないとき false を返す", () => {
    const value: unknown = { error: 123 };

    expect(isApiErrorResponse(value)).toBe(false);
  });

  it("code が AppErrorCode 外の文字列のとき false を返す", () => {
    const value: unknown = { code: "OTHER", error: "x" };

    expect(isApiErrorResponse(value)).toBe(false);
  });

  it.each([
    { input: null, label: "null" },
    { input: "x", label: "string" },
    { input: [], label: "array" },
  ])("$label のとき false を返す", ({ input }) => {
    expect(isApiErrorResponse(input)).toBe(false);
  });

  it("code が number のとき false を返す", () => {
    const value: unknown = { code: 123, error: "x" };

    expect(isApiErrorResponse(value)).toBe(false);
  });

  it("code が null のとき false を返す", () => {
    const value: unknown = { code: null, error: "x" };

    expect(isApiErrorResponse(value)).toBe(false);
  });
});
