import { createApiRouter } from "@server/api";

import { createFile, withTmpDir } from "./test-utils";

// 1x1 transparent PNG
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64"
);

describe("gET /api/files", () => {
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
});

describe("gET /api/file", () => {
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

  it("存在しないファイルで 404 を返す", async () => {
    await withTmpDir(async (tmpDir) => {
      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/file?path=nonexistent.md");
      expect(res.status).toBe(404);
    });
  });
});

describe("gET /api/image", () => {
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
});
