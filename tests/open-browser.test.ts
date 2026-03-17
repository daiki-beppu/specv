import { openInBrowser } from "@server/open-browser";

const { mockExecFile } = vi.hoisted(() => ({
  mockExecFile: vi.fn(),
}));

vi.mock(import("node:child_process"), () => ({
  execFile: mockExecFile,
}));

vi.mock(import("node:util"), () => ({
  promisify: () => mockExecFile,
}));

describe("server: openInBrowser", () => {
  // eslint-disable-next-line jest/no-hooks -- mock reset and global cleanup required
  beforeEach(() => {
    vi.unstubAllGlobals();
    mockExecFile.mockReset();
  });

  it("darwin で open コマンドが URL を引数に呼ばれる", async () => {
    vi.stubGlobal("process", { ...process, platform: "darwin" });
    mockExecFile.mockResolvedValue(null);

    await openInBrowser("http://localhost:4649");

    expect(mockExecFile).toHaveBeenCalledWith("open", [
      "http://localhost:4649",
    ]);
  });

  it("linux で xdg-open コマンドが URL を引数に呼ばれる", async () => {
    vi.stubGlobal("process", { ...process, platform: "linux" });
    mockExecFile.mockResolvedValue(null);

    await openInBrowser("http://localhost:4649");

    expect(mockExecFile).toHaveBeenCalledWith("xdg-open", [
      "http://localhost:4649",
    ]);
  });

  it("win32 で cmd 経由で start が呼ばれる", async () => {
    vi.stubGlobal("process", { ...process, platform: "win32" });
    mockExecFile.mockResolvedValue(null);

    await openInBrowser("http://localhost:4649");

    expect(mockExecFile).toHaveBeenCalledWith("cmd", [
      "/c",
      "start",
      "",
      "http://localhost:4649",
    ]);
  });

  it("コマンド実行エラー時に reject する", async () => {
    vi.stubGlobal("process", { ...process, platform: "darwin" });
    mockExecFile.mockRejectedValue(new Error("command not found"));

    await expect(openInBrowser("http://localhost:4649")).rejects.toThrow(
      "command not found"
    );
  });
});
