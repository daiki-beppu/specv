import { displayQrCode } from "@server/qr-display";
import qrcode from "qrcode-terminal";

vi.mock(import("qrcode-terminal"));

describe(displayQrCode, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("qrcode-terminal.generate を正しい URL と small オプションで呼び出す", () => {
    const generateSpy = vi.mocked(qrcode.generate);
    displayQrCode("http://192.168.1.5:4649");

    expect(generateSpy).toHaveBeenCalledWith(
      "http://192.168.1.5:4649",
      { small: true },
      expect.any(Function)
    );
  });
});
