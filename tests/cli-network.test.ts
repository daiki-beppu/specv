import { getNetworkConfig } from "@server/cli";

describe("getNetworkConfig", () => {
  it("--host なし → localhost バインド、ネットワーク情報なし", () => {
    const config = getNetworkConfig({ host: false });
    expect(config.hostname).toBe("127.0.0.1");
    expect(config.enableNetwork).toBe(false);
  });

  it("--host あり → 0.0.0.0 バインド、ネットワーク有効", () => {
    const config = getNetworkConfig({ host: true });
    expect(config.hostname).toBe("0.0.0.0");
    expect(config.enableNetwork).toBe(true);
  });
});
