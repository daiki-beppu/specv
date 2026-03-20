import {
  isExternalUrl,
  resolveImageSrc,
  resolvePath,
} from "@/components/markdown/path-utils";

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(isExternalUrl, () => {
  it("http:// を外部 URL と判定する", () => {
    expect(isExternalUrl("http://example.com/img.png")).toBeTruthy();
  });

  it("https:// を外部 URL と判定する", () => {
    expect(isExternalUrl("https://example.com/img.png")).toBeTruthy();
  });

  it("data: を外部 URL と判定する", () => {
    expect(isExternalUrl("data:image/png;base64,abc")).toBeTruthy();
  });

  it("相対パスを外部 URL と判定しない", () => {
    expect(isExternalUrl("images/photo.png")).toBeFalsy();
  });

  it("/ 始まりのパスを外部 URL と判定しない", () => {
    expect(isExternalUrl("/images/photo.png")).toBeFalsy();
  });
});

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(resolveImageSrc, () => {
  it("外部 URL はそのまま返す", () => {
    expect(
      resolveImageSrc("https://example.com/img.png", "docs/readme.md")
    ).toBe("https://example.com/img.png");
  });

  it("相対パスを /api/image?path=... に変換する", () => {
    expect(resolveImageSrc("photo.png", "docs/readme.md")).toBe(
      `/api/image?path=${encodeURIComponent("docs/photo.png")}`
    );
  });

  it("./ プレフィックスを除去する", () => {
    expect(resolveImageSrc("./photo.png", "docs/readme.md")).toBe(
      `/api/image?path=${encodeURIComponent("docs/photo.png")}`
    );
  });

  it("selectedPath=null でルートからの変換", () => {
    expect(resolveImageSrc("photo.png", null)).toBe(
      `/api/image?path=${encodeURIComponent("photo.png")}`
    );
  });

  it("ネストディレクトリの selectedPath を考慮する", () => {
    expect(resolveImageSrc("img.png", "a/b/c.md")).toBe(
      `/api/image?path=${encodeURIComponent("a/b/img.png")}`
    );
  });
});

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(resolvePath, () => {
  it("同一ディレクトリ内の解決", () => {
    expect(resolvePath("docs/readme.md", "other.md")).toBe("docs/other.md");
  });

  it("../ を含むパスの解決（単一）", () => {
    expect(resolvePath("docs/guide/intro.md", "../readme.md")).toBe(
      "docs/readme.md"
    );
  });

  it("../ を含むパスの解決（複数）", () => {
    expect(resolvePath("a/b/c/d.md", "../../x.md")).toBe("a/x.md");
  });

  it("ルートレベルからの解決", () => {
    expect(resolvePath("readme.md", "docs/guide.md")).toBe("docs/guide.md");
  });

  it(". セグメントを無視する", () => {
    expect(resolvePath("docs/readme.md", "./other.md")).toBe("docs/other.md");
  });

  it("ルートを超える ../ はルートに留まる", () => {
    expect(resolvePath("readme.md", "../../x.md")).toBe("x.md");
  });
});
