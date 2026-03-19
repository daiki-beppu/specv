import os from "node:os";

import { getLocalIpAddress } from "@server/network";

vi.mock("node:os");

describe("getLocalIpAddress", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("非内部 IPv4 アドレスを返す", () => {
    vi.mocked(os.networkInterfaces).mockReturnValue({
      en0: [
        {
          address: "fe80::1",
          cidr: "fe80::1/64",
          family: "IPv6",
          internal: false,
          mac: "00:00:00:00:00:00",
          netmask: "ffff:ffff:ffff:ffff::",
        },
        {
          address: "192.168.1.10",
          cidr: "192.168.1.10/24",
          family: "IPv4",
          internal: false,
          mac: "00:00:00:00:00:00",
          netmask: "255.255.255.0",
        },
      ],
      lo0: [
        {
          address: "127.0.0.1",
          cidr: "127.0.0.1/8",
          family: "IPv4",
          internal: true,
          mac: "00:00:00:00:00:00",
          netmask: "255.0.0.0",
        },
      ],
    });

    expect(getLocalIpAddress()).toBe("192.168.1.10");
  });

  it("該当アドレスがない場合 null を返す", () => {
    vi.mocked(os.networkInterfaces).mockReturnValue({
      lo0: [
        {
          address: "127.0.0.1",
          cidr: "127.0.0.1/8",
          family: "IPv4",
          internal: true,
          mac: "00:00:00:00:00:00",
          netmask: "255.0.0.0",
        },
      ],
    });

    expect(getLocalIpAddress()).toBeNull();
  });

  it("networkInterfaces が空オブジェクトを返す場合 null を返す", () => {
    vi.mocked(os.networkInterfaces).mockReturnValue({});

    expect(getLocalIpAddress()).toBeNull();
  });
});
