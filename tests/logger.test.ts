import { logError } from "@/lib/logger";

afterEach(() => {
  vi.restoreAllMocks();
});

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(logError, () => {
  it("message のみの呼び出しで console.error(message) に委譲する", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      // 出力ノイズ抑止
    });

    logError("something failed");

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith("something failed");
  });

  it("message と error の呼び出しで console.error(message, error) に委譲する", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      // 出力ノイズ抑止
    });
    const cause = new Error("boom");

    logError("operation failed", cause);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith("operation failed", cause);
  });
});
