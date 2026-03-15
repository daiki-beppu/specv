import { scanMarkdownFiles } from "@server/files";

import { createFile, createTmpDir, removeTmpDir } from "./test-utils";

describe("scanMarkdownFiles function", () => {
  it("ルートの .md ファイルを返す", async () => {
    const tmpDir = createTmpDir();
    try {
      createFile(tmpDir, "README.md", "# Hello");
      createFile(tmpDir, "CHANGELOG.md", "# Changes");

      const result = await scanMarkdownFiles(tmpDir);
      const names = result.map((f) => f.name);
      expect(names).toContain("README.md");
      expect(names).toContain("CHANGELOG.md");
    } finally {
      removeTmpDir(tmpDir);
    }
  });

  it("ネストされたディレクトリの .md を返す", async () => {
    const tmpDir = createTmpDir();
    try {
      createFile(tmpDir, "docs/guide.md", "# Guide");

      const result = await scanMarkdownFiles(tmpDir);
      const docsDir = result.find((f) => f.name === "docs");
      expect(docsDir?.children).toHaveLength(1);
      expect(docsDir?.children?.[0].name).toBe("guide.md");
    } finally {
      removeTmpDir(tmpDir);
    }
  });

  it(".md 以外のファイルを除外する", async () => {
    const tmpDir = createTmpDir();
    try {
      createFile(tmpDir, "README.md", "# Hello");
      createFile(tmpDir, "index.ts", "export {}");

      const result = await scanMarkdownFiles(tmpDir);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("README.md");
    } finally {
      removeTmpDir(tmpDir);
    }
  });

  it("node_modules を除外する", async () => {
    const tmpDir = createTmpDir();
    try {
      createFile(tmpDir, "README.md", "# Hello");
      createFile(tmpDir, "node_modules/pkg/README.md", "# Pkg");

      const result = await scanMarkdownFiles(tmpDir);
      expect(result).toHaveLength(1);
    } finally {
      removeTmpDir(tmpDir);
    }
  });

  it(".git を除外する", async () => {
    const tmpDir = createTmpDir();
    try {
      createFile(tmpDir, "README.md", "# Hello");
      createFile(tmpDir, ".git/HEAD", "ref: refs/heads/main");

      const result = await scanMarkdownFiles(tmpDir);
      expect(result).toHaveLength(1);
    } finally {
      removeTmpDir(tmpDir);
    }
  });

  it("空ディレクトリの場合は空配列を返す", async () => {
    const tmpDir = createTmpDir();
    try {
      const result = await scanMarkdownFiles(tmpDir);
      expect(result).toStrictEqual([]);
    } finally {
      removeTmpDir(tmpDir);
    }
  });

  it("深度制限（10階層）を超えない", async () => {
    const tmpDir = createTmpDir();
    try {
      createFile(tmpDir, "a/b/c/d/e/f/g/h/i/j/k/deep.md", "# Deep");

      const result = await scanMarkdownFiles(tmpDir);
      const findDeep = JSON.stringify(result);
      expect(findDeep).not.toContain("deep.md");
    } finally {
      removeTmpDir(tmpDir);
    }
  });
});
