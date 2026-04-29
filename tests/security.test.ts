import fs from "node:fs";
import path from "node:path";

import { validateImagePath, validatePath } from "@server/security";

import { createFile, withTmpDir } from "./test-utils";

const baseDir = "/home/user/project";

describe("validatePath function", () => {
  it("正常な相対パスを許可する", () => {
    expect(validatePath("README.md", baseDir)).toBe(
      path.join(baseDir, "README.md")
    );
  });

  it("ネストされたパスを許可する", () => {
    expect(validatePath("docs/guide.md", baseDir)).toBe(
      path.join(baseDir, "docs/guide.md")
    );
  });

  it(".. を含むパスを拒否する", () => {
    expect(() => validatePath("../etc/passwd", baseDir)).toThrow(
      /traversal|Only .md/
    );
  });

  it("uRL エンコードされたトラバーサルを拒否する", () => {
    expect(() => validatePath("%2e%2e/etc/passwd", baseDir)).toThrow(
      /traversal|Only .md/
    );
  });

  it("絶対パスを拒否する", () => {
    expect(() => validatePath("/etc/passwd", baseDir)).toThrow(
      /traversal|Only .md/
    );
  });

  it(".md 以外の拡張子を拒否する", () => {
    expect(() => validatePath("secret.env", baseDir)).toThrow(
      /Only .md files are allowed/
    );
  });

  it(".md 拡張子のファイルを許可する", () => {
    expect(validatePath("CHANGELOG.md", baseDir)).toBe(
      path.join(baseDir, "CHANGELOG.md")
    );
  });

  it("symlink が baseDir 外を指すとき path traversal で拒否する", async () => {
    await withTmpDir((outsideDir) =>
      withTmpDir((innerBaseDir) => {
        createFile(outsideDir, "secret.md", "secret");
        fs.symlinkSync(
          path.join(outsideDir, "secret.md"),
          path.join(innerBaseDir, "link.md")
        );

        expect(() => validatePath("link.md", innerBaseDir)).toThrow(
          /Path traversal detected/
        );
        return Promise.resolve();
      })
    );
  });
});

describe("validateImagePath function", () => {
  it.each([
    { ext: ".png" },
    { ext: ".jpg" },
    { ext: ".jpeg" },
    { ext: ".gif" },
    { ext: ".svg" },
    { ext: ".webp" },
  ])("$ext 拡張子の画像パスを許可する", ({ ext }) => {
    expect(validateImagePath(`image${ext}`, baseDir)).toBe(
      path.join(baseDir, `image${ext}`)
    );
  });

  it.each([{ ext: ".exe" }, { ext: ".sh" }, { ext: ".md" }])(
    "$ext を拒否する",
    ({ ext }) => {
      expect(() => validateImagePath(`file${ext}`, baseDir)).toThrow(
        /Unsupported image format/
      );
    }
  );

  it("../を含むパストラバーサルを拒否する", () => {
    expect(() => validateImagePath("../etc/image.png", baseDir)).toThrow(
      /traversal|Unsupported/
    );
  });

  it("uRL エンコードされたトラバーサルを拒否する", () => {
    expect(() => validateImagePath("%2e%2e/etc/image.png", baseDir)).toThrow(
      /traversal|Unsupported/
    );
  });

  it("絶対パスを拒否する", () => {
    expect(() => validateImagePath("/etc/image.png", baseDir)).toThrow(
      /traversal|Unsupported/
    );
  });

  it("ネストされたディレクトリの画像パスを許可する", () => {
    expect(validateImagePath("docs/images/photo.png", baseDir)).toBe(
      path.join(baseDir, "docs/images/photo.png")
    );
  });

  it("symlink が baseDir 外を指すとき path traversal で拒否する", async () => {
    await withTmpDir((outsideDir) =>
      withTmpDir((innerBaseDir) => {
        createFile(outsideDir, "secret.png", "secret");
        fs.symlinkSync(
          path.join(outsideDir, "secret.png"),
          path.join(innerBaseDir, "link.png")
        );

        expect(() => validateImagePath("link.png", innerBaseDir)).toThrow(
          /Path traversal detected/
        );
        return Promise.resolve();
      })
    );
  });
});
