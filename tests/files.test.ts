import { scanMarkdownFiles } from "@server/files";

import { createFile, withTmpDir } from "./test-utils";

describe(scanMarkdownFiles, () => {
  it("ルートの .md ファイルを返す", async () => {
    await withTmpDir(async (tmpDir) => {
      createFile(tmpDir, "README.md", "# Hello");
      createFile(tmpDir, "CHANGELOG.md", "# Changes");

      const result = await scanMarkdownFiles(tmpDir);
      const names = result.map((f) => f.name);

      expect(names).toContain("README.md");
      expect(names).toContain("CHANGELOG.md");
    });
  });

  it("ネストされたディレクトリの .md を返す", async () => {
    await withTmpDir(async (tmpDir) => {
      createFile(tmpDir, "docs/guide.md", "# Guide");

      const result = await scanMarkdownFiles(tmpDir);
      const docsDir = result.find((f) => f.name === "docs");

      expect(docsDir?.children).toHaveLength(1);
      expect(docsDir?.children?.[0].name).toBe("guide.md");
    });
  });

  it(".md 以外のファイルを除外する", async () => {
    await withTmpDir(async (tmpDir) => {
      createFile(tmpDir, "README.md", "# Hello");
      createFile(tmpDir, "index.ts", "export {}");

      const result = await scanMarkdownFiles(tmpDir);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("README.md");
    });
  });

  it("node_modules を除外する", async () => {
    await withTmpDir(async (tmpDir) => {
      createFile(tmpDir, "README.md", "# Hello");
      createFile(tmpDir, "node_modules/pkg/README.md", "# Pkg");

      const result = await scanMarkdownFiles(tmpDir);

      expect(result).toHaveLength(1);
    });
  });

  it(".git を除外する", async () => {
    await withTmpDir(async (tmpDir) => {
      createFile(tmpDir, "README.md", "# Hello");
      createFile(tmpDir, ".git/HEAD", "ref: refs/heads/main");

      const result = await scanMarkdownFiles(tmpDir);

      expect(result).toHaveLength(1);
    });
  });

  it("空ディレクトリの場合は空配列を返す", async () => {
    await withTmpDir(async (tmpDir) => {
      const result = await scanMarkdownFiles(tmpDir);

      expect(result).toStrictEqual([]);
    });
  });

  it("深度制限（10階層）を超えない", async () => {
    await withTmpDir(async (tmpDir) => {
      createFile(tmpDir, "a/b/c/d/e/f/g/h/i/j/k/deep.md", "# Deep");

      const result = await scanMarkdownFiles(tmpDir);
      const findDeep = JSON.stringify(result);

      expect(findDeep).not.toContain("deep.md");
    });
  });
});
