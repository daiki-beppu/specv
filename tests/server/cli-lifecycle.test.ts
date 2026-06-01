import {
  DISCONNECT_GRACE_MS,
  LIFECYCLE_HEARTBEAT_INTERVAL_MS,
  registerLifecycle,
} from "@server/lifecycle";
import { Hono } from "hono";

// SSE チャンクは実装が string / Uint8Array どちらでも enqueue しうるため、
// 取得経路をエンコードに依存させない。
const decodeChunk = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Uint8Array) {
    return new TextDecoder().decode(value);
  }
  throw new Error("unexpected SSE chunk type");
};

const setupLifecycle = () => {
  const onDisconnect = vi.fn();
  const app = new Hono();
  registerLifecycle(app, onDisconnect);
  return { app, onDisconnect };
};

const openLifecycle = async (
  app: Hono
): Promise<ReadableStreamDefaultReader<unknown>> => {
  const res = await app.request("/api/lifecycle");
  if (!res.body) {
    throw new Error("res.body is null");
  }
  return res.body.getReader();
};

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(registerLifecycle, () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("接続確立", () => {
    it("text/event-stream ヘッダを返す", async () => {
      const { app } = setupLifecycle();

      const res = await app.request("/api/lifecycle");

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/event-stream");
    });

    it("接続直後に connected を送出する", async () => {
      const { app } = setupLifecycle();
      const reader = await openLifecycle(app);

      const { value } = await reader.read();

      expect(decodeChunk(value)).toContain("connected");
      await reader.cancel();
    });
  });

  describe("heartbeat (keep-alive)", () => {
    it("heartbeat 間隔の経過ごとに SSE コメント行を送出する", async () => {
      const { app } = setupLifecycle();
      const reader = await openLifecycle(app);
      // connected を読み捨てる
      await reader.read();

      const heartbeatRead = reader.read();
      await vi.advanceTimersByTimeAsync(LIFECYCLE_HEARTBEAT_INTERVAL_MS);
      const { value } = await heartbeatRead;

      // コメント行 (":" 始まり) は EventSource にイベントとして拾われず、
      // 既存の data ハンドラを汚さない（plan の設計意図）。
      expect(decodeChunk(value).startsWith(":")).toBe(true);
      await reader.cancel();
    });

    it("heartbeat 間隔未満の経過では追加送出しない", async () => {
      const { app } = setupLifecycle();
      const reader = await openLifecycle(app);
      // connected
      await reader.read();

      const pendingRead = reader.read();
      await vi.advanceTimersByTimeAsync(LIFECYCLE_HEARTBEAT_INTERVAL_MS - 1);
      const race = await Promise.race([
        pendingRead.then(() => "got" as const),
        Promise.resolve("pending" as const),
      ]);

      expect(race).toBe("pending");
      await reader.cancel();
    });
  });

  describe("切断 grace と再接続", () => {
    it("切断後 grace 未満では onDisconnect を呼ばない", async () => {
      const { app, onDisconnect } = setupLifecycle();
      const reader = await openLifecycle(app);
      // connected
      await reader.read();

      await reader.cancel();
      await vi.advanceTimersByTimeAsync(DISCONNECT_GRACE_MS - 1);

      expect(onDisconnect).not.toHaveBeenCalled();
    });

    it("切断後 grace 経過で onDisconnect を 1 回呼ぶ", async () => {
      const { app, onDisconnect } = setupLifecycle();
      const reader = await openLifecycle(app);
      // connected
      await reader.read();

      await reader.cancel();
      await vi.advanceTimersByTimeAsync(DISCONNECT_GRACE_MS);

      expect(onDisconnect).toHaveBeenCalledTimes(1);
    });

    it("grace 期間内に再接続すると onDisconnect は呼ばれない", async () => {
      const { app, onDisconnect } = setupLifecycle();
      const reader1 = await openLifecycle(app);
      // connected
      await reader1.read();

      // 一時切断 → grace 開始
      await reader1.cancel();
      await vi.advanceTimersByTimeAsync(DISCONNECT_GRACE_MS - 1);
      // grace 内に再接続
      const reader2 = await openLifecycle(app);
      // connected
      await reader2.read();
      await vi.advanceTimersByTimeAsync(DISCONNECT_GRACE_MS);

      expect(onDisconnect).not.toHaveBeenCalled();
      await reader2.cancel();
    });
  });

  describe("onDisconnect 未指定 (--no-auto-close 相当)", () => {
    it("onDisconnect なしでも /api/lifecycle は text/event-stream を返す", async () => {
      const app = new Hono();
      registerLifecycle(app);

      const res = await app.request("/api/lifecycle");

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/event-stream");
    });

    it("onDisconnect なしで切断 → grace 経過しても副作用なく例外も投げない", async () => {
      const app = new Hono();
      registerLifecycle(app);
      const reader = await openLifecycle(app);
      // connected
      await reader.read();

      await reader.cancel();
      await expect(
        vi.advanceTimersByTimeAsync(DISCONNECT_GRACE_MS)
      ).resolves.not.toThrow();
      // grace タイマー発火後に残存タイマーが 0 なら interval も解放済み。
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe("リソース解放", () => {
    it("切断 → grace 経過後にタイマーが残らない（heartbeat リークしない）", async () => {
      const { app, onDisconnect } = setupLifecycle();
      const reader = await openLifecycle(app);
      // connected
      await reader.read();

      await reader.cancel();
      await vi.advanceTimersByTimeAsync(DISCONNECT_GRACE_MS);

      expect(onDisconnect).toHaveBeenCalledTimes(1);
      // grace タイマー発火後に残存タイマーが 0 なら heartbeat interval は解放済み。
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
