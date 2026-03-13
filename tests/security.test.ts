import path from "node:path";

import { validateImagePath, validatePath } from "@server/security.js";

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
});

describe("validateImagePath function", () => {
  it("正常な画像パスを許可する (.png, .jpg, .jpeg, .gif, .svg, .webp)", () => {
    for (const ext of [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"]) {
      expect(validateImagePath(`image${ext}`, baseDir)).toBe(
        path.join(baseDir, `image${ext}`)
      );
    }
  });

  it("非対応拡張子を拒否する", () => {
    for (const ext of [".exe", ".sh", ".md"]) {
      expect(() => validateImagePath(`file${ext}`, baseDir)).toThrow(
        /Unsupported image format/
      );
    }
  });

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
});
