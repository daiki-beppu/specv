import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { scanMarkdownFiles } from "../src/server/files.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mdv-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
});

function createFile(relativePath: string, content = "") {
  const fullPath = path.join(tmpDir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

describe("scanMarkdownFiles", () => {
  it("ルートの .md ファイルを返す", async () => {
    createFile("README.md", "# Hello");
    createFile("CHANGELOG.md", "# Changes");

    const result = await scanMarkdownFiles(tmpDir);
    const names = result.map((f) => f.name);
    expect(names).toContain("README.md");
    expect(names).toContain("CHANGELOG.md");
  });

  it("ネストされたディレクトリの .md を返す", async () => {
    createFile("docs/guide.md", "# Guide");

    const result = await scanMarkdownFiles(tmpDir);
    const docsDir = result.find((f) => f.name === "docs");
    expect(docsDir?.children).toHaveLength(1);
    expect(docsDir?.children?.[0].name).toBe("guide.md");
  });

  it(".md 以外のファイルを除外する", async () => {
    createFile("README.md", "# Hello");
    createFile("index.ts", "export {}");

    const result = await scanMarkdownFiles(tmpDir);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("README.md");
  });

  it("node_modules を除外する", async () => {
    createFile("README.md", "# Hello");
    createFile("node_modules/pkg/README.md", "# Pkg");

    const result = await scanMarkdownFiles(tmpDir);
    expect(result).toHaveLength(1);
  });

  it(".git を除外する", async () => {
    createFile("README.md", "# Hello");
    createFile(".git/HEAD", "ref: refs/heads/main");

    const result = await scanMarkdownFiles(tmpDir);
    expect(result).toHaveLength(1);
  });

  it("空ディレクトリの場合は空配列を返す", async () => {
    const result = await scanMarkdownFiles(tmpDir);
    expect(result).toEqual([]);
  });

  it("深度制限（10階層）を超えない", async () => {
    createFile("a/b/c/d/e/f/g/h/i/j/k/deep.md", "# Deep");

    const result = await scanMarkdownFiles(tmpDir);
    const findDeep = JSON.stringify(result);
    expect(findDeep).not.toContain("deep.md");
  });
});
