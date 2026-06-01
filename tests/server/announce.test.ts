import { announceAndOpen } from "@server/listen";
import { getLocalIpAddress } from "@server/network";
import { openInBrowser } from "@server/open-browser";
import { displayQrCode } from "@server/qr-display";

// Issue #142 要件4: CLI 出力とブラウザ起動 URL は固定文言ではなく
// 実際に bind した port を反映しなければならない。
// announceAndOpen を cli.ts の program.action クロージャから副作用のない
// モジュール (@server/listen) へ切り出し、依存を引数で受ける純関数として検証する。
// (`@server/cli` を import すると program.parse() が走り実サーバ起動とブラウザ
//  起動の副作用が発生するため、テスト対象を cli.ts に置くことはできない)

vi.mock("@server/open-browser");
vi.mock("@server/network");
vi.mock("@server/qr-display");

const baseParams = {
  baseDir: "/tmp/proj",
  enableNetwork: false,
  version: "9.9.9",
};

describe("announceAndOpen", () => {
  beforeEach(() => {
    vi.mocked(openInBrowser).mockResolvedValue();
    vi.mocked(getLocalIpAddress).mockReturnValue(null);
    vi.mocked(displayQrCode).mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("port を反映した URL でブラウザを開く", async () => {
    await announceAndOpen({ ...baseParams, port: 5173 });

    expect(openInBrowser).toHaveBeenCalledWith("http://localhost:5173");
  });

  it("Local 行に固定ポートではなく実際の bind port を表示する", async () => {
    await announceAndOpen({ ...baseParams, port: 5173 });

    expect(console.log).toHaveBeenCalledWith(
      "  ➜  Local:   http://localhost:5173"
    );
  });

  it("version 引数を起動バナーに表示する", async () => {
    await announceAndOpen({ ...baseParams, port: 5173 });

    expect(console.log).toHaveBeenCalledWith("  specv v9.9.9");
  });

  it("baseDir 引数を Serving 行に表示する", async () => {
    await announceAndOpen({ ...baseParams, port: 5173 });

    expect(console.log).toHaveBeenCalledWith("  Serving: /tmp/proj");
  });

  it("ブラウザ起動に失敗した場合は手動で開く URL を案内する", async () => {
    vi.mocked(openInBrowser).mockRejectedValue(new Error("no browser"));

    await announceAndOpen({ ...baseParams, port: 5173 });

    expect(console.log).toHaveBeenCalledWith(
      "  Open http://localhost:5173 in your browser"
    );
  });

  it("--host 有効時は Network 行に port を反映した URL を表示する", async () => {
    vi.mocked(getLocalIpAddress).mockReturnValue("192.168.1.10");

    await announceAndOpen({
      baseDir: "/tmp/proj",
      enableNetwork: true,
      version: "9.9.9",
      port: 5173,
    });

    expect(console.log).toHaveBeenCalledWith(
      "  ➜  Network: http://192.168.1.10:5173"
    );
  });
});
