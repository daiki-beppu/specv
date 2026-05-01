import fs from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { createApiRouter } from "@server/api";
import type { WatchCallback, WatchEvent } from "@server/watcher";

import { createFile, withTmpDir } from "./test-utils";

interface MockWatcher {
  close: ReturnType<typeof vi.fn>;
  emit: (event: WatchEvent) => void;
}

const createMockWatcherFactory = () => {
  const watchers: MockWatcher[] = [];

  const factory = (_baseDir: string, onEvent: WatchCallback) => {
    const closeFn = vi.fn();
    const mock: MockWatcher = {
      close: closeFn,
      emit: (event: WatchEvent) => {
        onEvent(event);
      },
    };
    watchers.push(mock);
    return { close: closeFn };
  };

  return { factory, watchers };
};

const readChunks = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
  events: string[],
  count: number
): Promise<void> => {
  while (events.length < count) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const parts = decoder
      .decode(value)
      .split("\n\n")
      .filter((p) => p.trim());
    events.push(...parts);
  }
};

const collectSSEEvents = async (
  stream: ReadableStream<Uint8Array>,
  count: number
): Promise<string[]> => {
  const reader = stream.getReader();
  const events: string[] = [];

  try {
    await readChunks(reader, new TextDecoder(), events, count);
  } finally {
    await reader.cancel();
  }

  return events;
};

const setupWatchApp = (tmpDir: string) => {
  createFile(tmpDir, "test.md", "# Test");
  const { factory, watchers } = createMockWatcherFactory();
  const app = createApiRouter(tmpDir, { createWatcher: factory });
  return { app, watchers };
};

const requestWatch = async (app: ReturnType<typeof createApiRouter>) => {
  const res = await app.request("/api/watch");
  if (!res.body) {
    throw new Error("res.body is null");
  }
  return res.body;
};

describe("gET /api/watch", () => {
  it("sSE ストリーム (text/event-stream) を返す", async () => {
    await withTmpDir(async (tmpDir) => {
      const { app } = setupWatchApp(tmpDir);
      const res = await app.request("/api/watch");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/event-stream");
    });
  });

  it("change イベント → file-changed SSE イベント送信", async () => {
    await withTmpDir(async (tmpDir) => {
      const { app, watchers } = setupWatchApp(tmpDir);
      const body = await requestWatch(app);

      await delay(50);
      watchers[0].emit({ path: "test.md", type: "change" });

      const events = await collectSSEEvents(body, 1);
      expect(events.find((e) => e.includes("event: file-changed"))).toContain(
        '"path":"test.md"'
      );
    });
  });

  it("add イベント → tree-changed SSE イベント送信", async () => {
    await withTmpDir(async (tmpDir) => {
      const { app, watchers } = setupWatchApp(tmpDir);
      const body = await requestWatch(app);

      await delay(50);
      watchers[0].emit({ path: "new.md", type: "add" });

      const events = await collectSSEEvents(body, 1);
      expect(events.find((e) => e.includes("event: tree-changed"))).toContain(
        '"files"'
      );
    });
  });

  it("unlink イベント → tree-changed SSE イベント送信", async () => {
    await withTmpDir(async (tmpDir) => {
      const { app, watchers } = setupWatchApp(tmpDir);
      const body = await requestWatch(app);

      await delay(50);
      watchers[0].emit({ path: "test.md", type: "unlink" });

      const events = await collectSSEEvents(body, 1);
      expect(events.find((e) => e.includes("event: tree-changed"))).toContain(
        '"files"'
      );
    });
  });

  it("300ms 内に add を 2 回受信したとき tree-changed が 1 回のみ送出される（debounce）", async () => {
    await withTmpDir(async (tmpDir) => {
      const { app, watchers } = setupWatchApp(tmpDir);
      const body = await requestWatch(app);
      const reader = body.getReader();
      const decoder = new TextDecoder();
      const events: string[] = [];

      try {
        await delay(50);
        watchers[0].emit({ path: "a.md", type: "add" });
        watchers[0].emit({ path: "b.md", type: "add" });

        await readChunks(reader, decoder, events, 1);
        const secondReadPromise = reader.read();
        const result = await Promise.race([
          secondReadPromise.then(() => "got-second-read" as const),
          delay(200).then(() => "timeout" as const),
        ]);

        expect(result).toBe("timeout");
        expect(events.length).toBe(1);
        expect(events[0]).toContain("event: tree-changed");
      } finally {
        await reader.cancel();
      }
    });
  });

  it("listener cancel 後の emit が throw しない（sseListeners.delete 経路）", async () => {
    await withTmpDir(async (tmpDir) => {
      const { app, watchers } = setupWatchApp(tmpDir);
      const body = await requestWatch(app);
      const reader = body.getReader();

      await delay(50);
      await reader.cancel();

      expect(() => {
        watchers[0].emit({ path: "test.md", type: "change" });
      }).not.toThrow();
    });
  });

  it("scanMarkdownFiles が throw したとき tree-changed が SSE に流れず後続の change は届く", async () => {
    // setupWatcher 内 setTimeout コールバックの try/catch (Scan failure is non-fatal) を担保する。
    // baseDir を subdir として作成し、watcher 登録後に subdir のみ rm することで scan を恒常失敗させる。
    // tmpDir 自体は withTmpDir の finally に委ね、ENOENT 衝突を避ける（tests/api.test.ts:42-58 と同型）。
    await withTmpDir(async (tmpDir) => {
      const baseDir = path.join(tmpDir, "base");
      fs.mkdirSync(baseDir);
      const { app, watchers } = setupWatchApp(baseDir);
      const body = await requestWatch(app);
      const reader = body.getReader();
      const decoder = new TextDecoder();

      fs.rmSync(baseDir, { force: true, recursive: true });

      try {
        await delay(50);
        watchers[0].emit({ path: "new.md", type: "add" });

        const firstRead = reader.read();
        const raceResult = await Promise.race([
          firstRead.then(() => "got" as const),
          delay(400).then(() => "timeout" as const),
        ]);

        expect(raceResult).toBe("timeout");

        watchers[0].emit({ path: "any", type: "change" });
        const chunk = await firstRead;
        const text = decoder.decode(chunk.value);

        expect(text).toContain("event: file-changed");
      } finally {
        await reader.cancel();
      }
    });
  });
});
