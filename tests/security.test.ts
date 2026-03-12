import { describe, it, expect } from "vitest";
import path from "node:path";
import { validatePath } from "../src/server/security.js";

const baseDir = "/home/user/project";

describe("validatePath", () => {
  it("正常な相対パスを許可する", () => {
    expect(validatePath("README.md", baseDir)).toBe(
      path.join(baseDir, "README.md"),
    );
  });

  it("ネストされたパスを許可する", () => {
    expect(validatePath("docs/guide.md", baseDir)).toBe(
      path.join(baseDir, "docs/guide.md"),
    );
  });

  it(".. を含むパスを拒否する", () => {
    expect(() => validatePath("../etc/passwd", baseDir)).toThrow();
  });

  it("URL エンコードされたトラバーサルを拒否する", () => {
    expect(() => validatePath("%2e%2e/etc/passwd", baseDir)).toThrow();
  });

  it("絶対パスを拒否する", () => {
    expect(() => validatePath("/etc/passwd", baseDir)).toThrow();
  });

  it(".md 以外の拡張子を拒否する", () => {
    expect(() => validatePath("secret.env", baseDir)).toThrow();
  });

  it(".md 拡張子のファイルを許可する", () => {
    expect(validatePath("CHANGELOG.md", baseDir)).toBe(
      path.join(baseDir, "CHANGELOG.md"),
    );
  });
});
