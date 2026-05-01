describe("cli (module load)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock("node:fs");
  });

  it("package.json に version が無いとき Invalid package.json: missing version を throw する", async () => {
    vi.doMock("node:fs", () => {
      const readFileSync = vi.fn().mockReturnValue('{ "name": "specv" }');
      const existsSync = vi.fn().mockReturnValue(false);
      return {
        default: { existsSync, readFileSync },
        existsSync,
        readFileSync,
      };
    });

    await expect(import("@server/cli")).rejects.toThrow(
      "Invalid package.json: missing version"
    );
  });

  it("package.json が不正 JSON のとき SyntaxError を throw する", async () => {
    vi.doMock("node:fs", () => {
      const readFileSync = vi.fn().mockReturnValue("{not-json");
      const existsSync = vi.fn().mockReturnValue(false);
      return {
        default: { existsSync, readFileSync },
        existsSync,
        readFileSync,
      };
    });

    await expect(import("@server/cli")).rejects.toThrow(SyntaxError);
  });
});
