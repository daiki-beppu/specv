import fs from "node:fs";
import path from "node:path";

import { createApiRouter } from "@server/api";

import { createFile, withTmpDir } from "./test-utils";

// 1x1 transparent PNG
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64"
);

// eslint-disable-next-line vitest/prefer-lowercase-title -- HTTP method
describe("GET /api/files", () => {
  it("markdown ファイル一覧を JSON で返す", async () => {
    await withTmpDir(async (tmpDir) => {
      createFile(tmpDir, "README.md", "# Hello");
      createFile(tmpDir, "docs/guide.md", "# Guide");

      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/files");
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.files).toBeDefined();
      expect(json.files.length).toBeGreaterThan(0);
    });
  });

  it("空ディレクトリで空配列を返す", async () => {
    await withTmpDir(async (tmpDir) => {
      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/files");
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.files).toStrictEqual([]);
    });
  });

  it("scanMarkdownFiles が throw したとき 500 + Failed to scan files を返す", async () => {
    await withTmpDir(async (tmpDir) => {
      const subdir = path.join(tmpDir, "base");
      fs.mkdirSync(subdir);
      const app = createApiRouter(subdir, {
        createWatcher: () => ({ close: vi.fn() }),
      });
      fs.rmSync(subdir, { force: true, recursive: true });

      const res = await app.request("/api/files");

      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual({
        error: "Failed to scan files",
      });
    });
  });
});

// eslint-disable-next-line vitest/prefer-lowercase-title -- HTTP method
describe("GET /api/file", () => {
  it("path パラメータなしで 400 を返す", async () => {
    await withTmpDir(async (tmpDir) => {
      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/file");
      expect(res.status).toBe(400);
    });
  });

  it("正常な .md ファイルの内容を返す", async () => {
    await withTmpDir(async (tmpDir) => {
      createFile(tmpDir, "README.md", "# Hello World");

      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/file?path=README.md");
      expect(res.status).toBe(200);
      await expect(res.text()).resolves.toBe("# Hello World");
    });
  });

  it("パストラバーサルで 400 を返す", async () => {
    await withTmpDir(async (tmpDir) => {
      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/file?path=../etc/passwd");
      expect(res.status).toBe(400);
    });
  });

  it('パストラバーサル時のレスポンス body が code: "SECURITY" を含む', async () => {
    await withTmpDir(async (tmpDir) => {
      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/file?path=../etc/passwd");

      expect(res.status).toBe(400);
      const json = (await res.json()) as { code?: string; error: string };
      expect(json.code).toBe("SECURITY");
      expect(typeof json.error).toBe("string");
    });
  });

  it("存在しないファイルで 404 を返す", async () => {
    await withTmpDir(async (tmpDir) => {
      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/file?path=nonexistent.md");
      expect(res.status).toBe(404);
    });
  });

  it("存在しないファイル時のレスポンス body は code フィールドを含まない", async () => {
    await withTmpDir(async (tmpDir) => {
      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/file?path=nonexistent.md");

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json).not.toHaveProperty("code");
    });
  });
});

// eslint-disable-next-line vitest/prefer-lowercase-title -- HTTP method
describe("GET /api/image", () => {
  it("path パラメータなしで 400 を返す", async () => {
    await withTmpDir(async (tmpDir) => {
      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/image");
      expect(res.status).toBe(400);
    });
  });

  it("正常な画像ファイルを正しい Content-Type で返す", async () => {
    await withTmpDir(async (tmpDir) => {
      createFile(tmpDir, "img.png", TINY_PNG);

      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/image?path=img.png");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("image/png");
    });
  });

  it("パストラバーサルで 400 を返す", async () => {
    await withTmpDir(async (tmpDir) => {
      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/image?path=../etc/image.png");
      expect(res.status).toBe(400);
    });
  });

  it('パストラバーサル時のレスポンス body が code: "SECURITY" を含む', async () => {
    await withTmpDir(async (tmpDir) => {
      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/image?path=../etc/image.png");

      expect(res.status).toBe(400);
      const json = (await res.json()) as { code?: string; error: string };
      expect(json.code).toBe("SECURITY");
      expect(typeof json.error).toBe("string");
    });
  });

  it("存在しないファイルで 404 を返す", async () => {
    await withTmpDir(async (tmpDir) => {
      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/image?path=nonexistent.png");
      expect(res.status).toBe(404);
    });
  });

  it("非対応拡張子で 400 を返す", async () => {
    await withTmpDir(async (tmpDir) => {
      createFile(tmpDir, "script.sh", "#!/bin/bash");

      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/image?path=script.sh");
      expect(res.status).toBe(400);
    });
  });

  it.each<{ contentType: string; filename: string; payload: Buffer | string }>([
    {
      contentType: "image/gif",
      filename: "img.gif",
      payload: Buffer.from([0]),
    },
    {
      contentType: "image/jpeg",
      filename: "img.jpeg",
      payload: Buffer.from([0]),
    },
    {
      contentType: "image/jpeg",
      filename: "img.jpg",
      payload: Buffer.from([0]),
    },
    {
      contentType: "image/svg+xml",
      filename: "img.svg",
      payload: "<svg/>",
    },
    {
      contentType: "image/webp",
      filename: "img.webp",
      payload: Buffer.from([0]),
    },
  ])(
    "$filename を 200 + Content-Type: $contentType で返す",
    async ({ contentType, filename, payload }) => {
      await withTmpDir(async (tmpDir) => {
        createFile(tmpDir, filename, payload);

        const app = createApiRouter(tmpDir);
        const res = await app.request(`/api/image?path=${filename}`);

        expect(res.status).toBe(200);
        expect(res.headers.get("Content-Type")).toBe(contentType);
      });
    }
  );

  // eslint-disable-next-line vitest/warn-todo -- order.md L18 / plan R12: 到達不能分岐を仕様の所在記録として `it.todo` で残す
  it.todo(
    "application/octet-stream フォールバックは validateImagePath のホワイトリストにより到達不能"
  );
});
