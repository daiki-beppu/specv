import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { createApiRouter } from "@server/api.js";

const createTmpDir = () =>
  fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "specv-api-")));

const removeTmpDir = (dir: string) => {
  fs.rmSync(dir, { recursive: true });
};

const createFile = (
  tmpDir: string,
  relativePath: string,
  content: string | Buffer = ""
) => {
  const fullPath = path.join(tmpDir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
};

// 1x1 transparent PNG
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64"
);

const setupFilesDir = () => {
  const tmpDir = createTmpDir();
  createFile(tmpDir, "README.md", "# Hello");
  createFile(tmpDir, "docs/guide.md", "# Guide");
  return tmpDir;
};

describe("gET /api/files", () => {
  it("markdown ファイル一覧を JSON で返す", async () => {
    const tmpDir = setupFilesDir();
    try {
      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/files");
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.files).toBeDefined();
      expect(json.files.length).toBeGreaterThan(0);
    } finally {
      removeTmpDir(tmpDir);
    }
  });

  it("空ディレクトリで空配列を返す", async () => {
    const tmpDir = createTmpDir();
    try {
      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/files");
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.files).toStrictEqual([]);
    } finally {
      removeTmpDir(tmpDir);
    }
  });
});

describe("gET /api/file", () => {
  it("path パラメータなしで 400 を返す", async () => {
    const tmpDir = createTmpDir();
    try {
      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/file");
      expect(res.status).toBe(400);
    } finally {
      removeTmpDir(tmpDir);
    }
  });

  it("正常な .md ファイルの内容を返す", async () => {
    const tmpDir = createTmpDir();
    try {
      createFile(tmpDir, "README.md", "# Hello World");

      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/file?path=README.md");
      expect(res.status).toBe(200);
      await expect(res.text()).resolves.toBe("# Hello World");
    } finally {
      removeTmpDir(tmpDir);
    }
  });

  it("パストラバーサルで 400 を返す", async () => {
    const tmpDir = createTmpDir();
    try {
      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/file?path=../etc/passwd");
      expect(res.status).toBe(400);
    } finally {
      removeTmpDir(tmpDir);
    }
  });

  it("存在しないファイルで 404 を返す", async () => {
    const tmpDir = createTmpDir();
    try {
      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/file?path=nonexistent.md");
      expect(res.status).toBe(404);
    } finally {
      removeTmpDir(tmpDir);
    }
  });
});

describe("gET /api/image", () => {
  it("path パラメータなしで 400 を返す", async () => {
    const tmpDir = createTmpDir();
    try {
      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/image");
      expect(res.status).toBe(400);
    } finally {
      removeTmpDir(tmpDir);
    }
  });

  it("正常な画像ファイルを正しい Content-Type で返す", async () => {
    const tmpDir = createTmpDir();
    try {
      createFile(tmpDir, "img.png", TINY_PNG);

      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/image?path=img.png");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("image/png");
    } finally {
      removeTmpDir(tmpDir);
    }
  });

  it("パストラバーサルで 400 を返す", async () => {
    const tmpDir = createTmpDir();
    try {
      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/image?path=../etc/image.png");
      expect(res.status).toBe(400);
    } finally {
      removeTmpDir(tmpDir);
    }
  });

  it("存在しないファイルで 404 を返す", async () => {
    const tmpDir = createTmpDir();
    try {
      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/image?path=nonexistent.png");
      expect(res.status).toBe(404);
    } finally {
      removeTmpDir(tmpDir);
    }
  });

  it("非対応拡張子で 400 を返す", async () => {
    const tmpDir = createTmpDir();
    try {
      createFile(tmpDir, "script.sh", "#!/bin/bash");

      const app = createApiRouter(tmpDir);
      const res = await app.request("/api/image?path=script.sh");
      expect(res.status).toBe(400);
    } finally {
      removeTmpDir(tmpDir);
    }
  });
});
