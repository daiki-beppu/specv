import fs from "node:fs";
import path from "node:path";

import { createWatcher } from "@server/watcher";

import { createFile, delay, withTmpDir } from "./test-utils";

const waitForEvent = async (
  cb: ReturnType<typeof vi.fn>,
  timeout = 2000
): Promise<void> => {
  await vi.waitFor(() => expect(cb.mock.calls.length).toBeGreaterThan(0), {
    interval: 50,
    timeout,
  });
};

describe("server: createWatcher", () => {
  it(".md ファイルの変更を検知する", async () => {
    await withTmpDir(async (tmpDir) => {
      createFile(tmpDir, "test.md", "initial");
      const cb = vi.fn();
      const { close } = createWatcher(tmpDir, cb);

      try {
        await delay(100);
        fs.writeFileSync(path.join(tmpDir, "test.md"), "updated");

        await waitForEvent(cb);
        expect(cb).toHaveBeenCalledWith(
          expect.objectContaining({ path: "test.md", type: "change" })
        );
      } finally {
        close();
      }
    });
  });

  it(".md ファイルの追加を検知する", async () => {
    await withTmpDir(async (tmpDir) => {
      const cb = vi.fn();
      const { close } = createWatcher(tmpDir, cb);

      try {
        await delay(100);
        createFile(tmpDir, "new.md", "hello");

        await waitForEvent(cb);
        expect(cb).toHaveBeenCalledWith(
          expect.objectContaining({ path: "new.md", type: "add" })
        );
      } finally {
        close();
      }
    });
  });

  it(".md ファイルの削除を検知する", async () => {
    await withTmpDir(async (tmpDir) => {
      createFile(tmpDir, "delete-me.md", "bye");
      const cb = vi.fn();
      const { close } = createWatcher(tmpDir, cb);

      try {
        await delay(100);
        fs.unlinkSync(path.join(tmpDir, "delete-me.md"));

        await waitForEvent(cb);
        expect(cb).toHaveBeenCalledWith(
          expect.objectContaining({ path: "delete-me.md", type: "unlink" })
        );
      } finally {
        close();
      }
    });
  });

  it(".md 以外のファイルは無視する", async () => {
    await withTmpDir(async (tmpDir) => {
      const cb = vi.fn();
      const { close } = createWatcher(tmpDir, cb);

      try {
        await delay(100);
        createFile(tmpDir, "readme.txt", "hello");
        await delay(500);
        expect(cb).not.toHaveBeenCalled();
      } finally {
        close();
      }
    });
  });

  it("iGNORED_DIRS 内の変更は無視する", async () => {
    await withTmpDir(async (tmpDir) => {
      const cb = vi.fn();
      const { close } = createWatcher(tmpDir, cb);

      try {
        await delay(100);
        createFile(tmpDir, "node_modules/pkg/README.md", "hello");
        await delay(500);
        expect(cb).not.toHaveBeenCalled();
      } finally {
        close();
      }
    });
  });

  it("close() で監視停止する", async () => {
    await withTmpDir(async (tmpDir) => {
      createFile(tmpDir, "test.md", "initial");
      const cb = vi.fn();
      const { close } = createWatcher(tmpDir, cb);

      await delay(100);
      close();

      fs.writeFileSync(path.join(tmpDir, "test.md"), "after close");
      await delay(500);
      expect(cb).not.toHaveBeenCalled();
    });
  });

  it("デバウンス: 連続変更が 1 回にまとまる", async () => {
    await withTmpDir(async (tmpDir) => {
      createFile(tmpDir, "debounce.md", "v0");
      const cb = vi.fn();
      const { close } = createWatcher(tmpDir, cb);

      try {
        await delay(100);
        for (const v of ["v1", "v2", "v3"]) {
          fs.writeFileSync(path.join(tmpDir, "debounce.md"), v);
        }
        await delay(500);
        // eslint-disable-next-line vitest/prefer-called-times
        expect(cb).toHaveBeenCalledOnce();
      } finally {
        close();
      }
    });
  });

  it("baseDir 外のパスが除外される", async () => {
    await withTmpDir(async (tmpDir) => {
      const cb = vi.fn();
      const { close } = createWatcher(tmpDir, cb);

      try {
        await delay(100);
        await delay(500);
        expect(cb).not.toHaveBeenCalled();
      } finally {
        close();
      }
    });
  });

  it("サブディレクトリ内の .md ファイル変更を検知する", async () => {
    await withTmpDir(async (tmpDir) => {
      createFile(tmpDir, "docs/guide.md", "initial");
      const cb = vi.fn();
      const { close } = createWatcher(tmpDir, cb);

      try {
        await delay(100);
        fs.writeFileSync(path.join(tmpDir, "docs/guide.md"), "updated");

        await waitForEvent(cb);
        expect(cb).toHaveBeenCalledWith(
          expect.objectContaining({ path: "docs/guide.md", type: "change" })
        );
      } finally {
        close();
      }
    });
  });

  it("同一パスで add を検知した直後に change へ遷移する", async () => {
    await withTmpDir(async (tmpDir) => {
      const cb = vi.fn();
      const { close } = createWatcher(tmpDir, cb);

      try {
        await delay(100);
        createFile(tmpDir, "transition.md", "v1");
        await vi.waitFor(
          () =>
            expect(cb).toHaveBeenCalledWith(
              expect.objectContaining({ path: "transition.md", type: "add" })
            ),
          { timeout: 2000 }
        );

        fs.writeFileSync(path.join(tmpDir, "transition.md"), "v2");
        await vi.waitFor(
          () =>
            expect(cb).toHaveBeenCalledWith(
              expect.objectContaining({ path: "transition.md", type: "change" })
            ),
          { timeout: 2000 }
        );
      } finally {
        close();
      }
    });
  });
});

describe("server: createWatcher (mocked fs.watch)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("filename が null のとき onEvent を呼ばない", async () => {
    await withTmpDir(async (tmpDir) => {
      const watchSpy = vi.spyOn(fs, "watch");
      const cb = vi.fn();
      const { close } = createWatcher(tmpDir, cb);

      try {
        const captured = watchSpy.mock.calls[0]?.[2] as (
          event: string,
          filename: string | null
        ) => void;
        captured("change", null);

        await delay(500);
        expect(cb).not.toHaveBeenCalled();
      } finally {
        close();
      }
    });
  });

  it("baseDir 外を指すパス（..）のとき onEvent を呼ばない", async () => {
    await withTmpDir(async (tmpDir) => {
      const watchSpy = vi.spyOn(fs, "watch");
      const cb = vi.fn();
      const { close } = createWatcher(tmpDir, cb);

      try {
        const captured = watchSpy.mock.calls[0]?.[2] as (
          event: string,
          filename: string | null
        ) => void;
        captured("change", "../external.md");

        await delay(500);
        expect(cb).not.toHaveBeenCalled();
      } finally {
        close();
      }
    });
  });
});

describe("server: createWatcher (mocked readdirSync)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("scanExisting で readdirSync が throw しても createWatcher が例外を伝播しない", async () => {
    await withTmpDir(async (tmpDir) => {
      vi.spyOn(fs, "readdirSync").mockImplementationOnce(() => {
        throw new Error("EACCES: permission denied");
      });
      const cb = vi.fn();

      let watcher: { close: () => void } | undefined;
      expect(() => {
        watcher = createWatcher(tmpDir, cb);
      }).not.toThrow();

      await delay(100);
      expect(cb).not.toHaveBeenCalled();
      watcher?.close();
    });
  });
});
