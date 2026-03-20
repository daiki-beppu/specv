// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";

import { Preview } from "@/components/markdown/preview";

vi.mock(import("@/hooks/use-theme"), () => ({
  useTheme: () => ({ theme: "light" as const, toggle: vi.fn() }),
}));

// eslint-disable-next-line no-empty-function -- テスト用スタブ
const noop = () => {};

describe("preview rendering", () => {
  // eslint-disable-next-line jest/no-hooks -- jsdom cleanup required
  afterEach(() => {
    cleanup();
  });

  describe("絵文字ショートコード (#6)", () => {
    it(":smile: が絵文字としてレンダリングされる", () => {
      render(
        <Preview
          content=":smile: hello"
          selectedPath="test.md"
          onNavigate={noop}
        />
      );

      expect(screen.getByText(/😄/)).toBeDefined();
    });
  });

  describe("hTML タグ描画 (#9)", () => {
    it("<details> がレンダリングされる", () => {
      render(
        <Preview
          content={"<details><summary>Title</summary>\n\nContent\n\n</details>"}
          selectedPath="test.md"
          onNavigate={noop}
        />
      );

      expect(document.querySelector("details")).not.toBeNull();
      expect(document.querySelector("summary")).not.toBeNull();
    });

    it("<kbd> がレンダリングされる", () => {
      render(
        <Preview
          content="<kbd>Ctrl</kbd>"
          selectedPath="test.md"
          onNavigate={noop}
        />
      );

      expect(document.querySelector("kbd")).not.toBeNull();
    });

    it("<script> がレンダリングされない", () => {
      render(
        <Preview
          content="<script>alert('xss')<\/script>"
          selectedPath="test.md"
          onNavigate={noop}
        />
      );

      expect(document.querySelector("script")).toBeNull();
    });
  });

  describe("脚注 (#3)", () => {
    it("脚注がレンダリングされる", () => {
      render(
        <Preview
          content={"テキスト[^1]\n\n[^1]: 脚注の内容"}
          selectedPath="test.md"
          onNavigate={noop}
        />
      );

      const section = document.querySelector("[data-footnotes]");
      expect(section).not.toBeNull();
    });
  });
});
