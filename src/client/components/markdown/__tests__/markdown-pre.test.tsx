// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";

import { MarkdownPre } from "@/components/markdown/markdown-pre";

vi.mock(import("@/components/copy-button"), () => ({
  CopyButton: ({ text }: { text: string }) => (
    <button data-testid="copy-button" data-text={text}>
      Copy
    </button>
  ),
}));

describe("MarkdownPre", () => {
  // eslint-disable-next-line jest/no-hooks -- jsdom cleanup required
  afterEach(() => {
    cleanup();
  });

  it("mermaid クラスを持つ code 要素 → pre ラップなしで children がそのまま返る", () => {
    const { container } = render(
      <MarkdownPre>
        <code className="language-mermaid">graph TD; A--&gt;B;</code>
      </MarkdownPre>
    );

    expect(container.querySelector("pre")).toBeNull();
    expect(container.querySelector("code")).not.toBeNull();
  });

  it("通常のコードブロック → CopyButton + pre でラップされる", () => {
    render(
      <MarkdownPre>
        <code className="language-js">{"const x = 1;\n"}</code>
      </MarkdownPre>
    );

    expect(screen.getByTestId("copy-button")).toBeDefined();
    expect(screen.getByTestId("copy-button").dataset.text).toBe("const x = 1;");
  });

  it("code 要素の末尾改行が除去される", () => {
    render(
      <MarkdownPre>
        <code className="language-js">{"hello\nworld\n"}</code>
      </MarkdownPre>
    );

    expect(screen.getByTestId("copy-button").dataset.text).toBe("hello\nworld");
  });
});
