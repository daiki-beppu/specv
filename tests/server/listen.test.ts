import net from "node:net";

import { listenWithFallback } from "@server/listen";
import { Hono } from "hono";

// Issue #142: 別ディレクトリで specv を複数起動したとき、各インスタンスが
// 別ポートに独立して bind され「後勝ち」で上書きされないことを保証する。
// 実 TCP を占有して "別プロセスが既にポートを握っている" 状況を再現する。

const HOST = "127.0.0.1";

const createApp = (): Hono => {
  const app = new Hono();
  app.get("/", (c) => c.text("ok"));
  return app;
};

const getFreePort = (): Promise<number> =>
  new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, HOST, () => {
      const addr = probe.address();
      if (addr === null || typeof addr === "string") {
        probe.close();
        reject(new Error("could not determine a free port"));
        return;
      }
      const { port } = addr;
      probe.close(() => {
        resolve(port);
      });
    });
  });

const canBind = (port: number): Promise<boolean> =>
  new Promise((resolve) => {
    const probe = net.createServer();
    probe.once("error", () => {
      resolve(false);
    });
    probe.listen(port, HOST, () => {
      probe.close(() => {
        resolve(true);
      });
    });
  });

// startPort と startPort+1 が同時に空いている基準ポートを探す。
// フォールバック先 (startPort+1) を決め打ちで検証するために必要。
const getConsecutiveFreePort = async (): Promise<number> => {
  for (let attempt = 0; attempt < 30; attempt++) {
    const base = await getFreePort();
    if ((await canBind(base)) && (await canBind(base + 1))) {
      return base;
    }
  }
  throw new Error("could not find two consecutive free ports");
};

const occupiers: net.Server[] = [];
const started: Array<{ close: (callback?: () => void) => void }> = [];

const occupy = (port: number): Promise<void> =>
  new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once("error", reject);
    srv.listen(port, HOST, () => {
      occupiers.push(srv);
      resolve();
    });
  });

const closeAll = (
  servers: Array<{ close: (callback?: () => void) => void }>
): Promise<void[]> =>
  Promise.all(
    servers.map(
      (server) =>
        new Promise<void>((resolve) => {
          server.close(() => {
            resolve();
          });
        })
    )
  );

let logSpy: ReturnType<typeof vi.spyOn>;

describe("listenWithFallback", () => {
  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(async () => {
    await closeAll(started);
    await closeAll(occupiers);
    started.length = 0;
    occupiers.length = 0;
    vi.restoreAllMocks();
  });

  it("空きポートで listen でき、実際に bind した port を resolve する", async () => {
    const port = await getFreePort();

    const result = await listenWithFallback(createApp(), HOST, port);
    started.push(result.server);

    expect(result.port).toBe(port);
  });

  it("startPort が使用中なら startPort+1 にフォールバックして bind する", async () => {
    const base = await getConsecutiveFreePort();
    await occupy(base);

    const result = await listenWithFallback(createApp(), HOST, base);
    started.push(result.server);

    expect(result.port).toBe(base + 1);
  });

  it("同一 startPort から 2 回起動すると 2 つ目は別ポートに bind され互いに干渉しない", async () => {
    const base = await getConsecutiveFreePort();

    const first = await listenWithFallback(createApp(), HOST, base);
    started.push(first.server);
    const second = await listenWithFallback(createApp(), HOST, base);
    started.push(second.server);

    expect(first.port).toBe(base);
    expect(second.port).toBe(base + 1);
    expect(second.port).not.toBe(first.port);
  });

  it("フォールバック時に使用中ポートと次ポートを示すメッセージをログ出力する", async () => {
    const base = await getConsecutiveFreePort();
    await occupy(base);

    const result = await listenWithFallback(createApp(), HOST, base);
    started.push(result.server);

    expect(logSpy).toHaveBeenCalledWith(
      `Port ${base} is in use, trying ${base + 1}...`
    );
  });

  it("リトライ枠が無い (maxRetries=0) 状態で startPort が使用中なら reject する", async () => {
    const port = await getFreePort();
    await occupy(port);

    await expect(
      listenWithFallback(createApp(), HOST, port, 0)
    ).rejects.toBeInstanceOf(Error);
  });

  it("startPort から maxRetries 先まで全て使用中なら reject する", async () => {
    const base = await getConsecutiveFreePort();
    await occupy(base);
    await occupy(base + 1);

    await expect(
      listenWithFallback(createApp(), HOST, base, 1)
    ).rejects.toBeInstanceOf(Error);
    // base が使用中なので 1 回はフォールバックを試みている
    expect(logSpy).toHaveBeenCalledWith(
      `Port ${base} is in use, trying ${base + 1}...`
    );
  });

  it("EADDRINUSE 以外のエラーではフォールバックせず即 reject する", async () => {
    const port = await getFreePort();

    // RFC5737 TEST-NET-1 (192.0.2.0/24) は割り当て不能で EADDRNOTAVAIL になる
    await expect(
      listenWithFallback(createApp(), "192.0.2.1", port)
    ).rejects.toBeInstanceOf(Error);
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("is in use")
    );
  });
});
