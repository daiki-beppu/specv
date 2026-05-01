// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";

import { MarkdownPre } from "@/components/markdown/markdown-pre";

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(MarkdownPre, () => {
  // eslint-disable-next-line jest/no-hooks -- jsdom cleanup required
  afterEach(() => {
    cleanup();
  });

  it("language-ts の codeEl を <pre> + CopyButton でラップする", () => {
    const { container } = render(
      <MarkdownPre>
        <code className="language-ts">const x = 1;</code>
      </MarkdownPre>
    );

    expect(container.querySelector("pre")).not.toBeNull();
    expect(screen.getByTitle("Copy")).toBeDefined();
  });

  it('codeEl の className="" でも <pre> ラップ経路に入る', () => {
    const { container } = render(
      <MarkdownPre>
        <code className="">x</code>
      </MarkdownPre>
    );

    expect(container.querySelector("pre")).not.toBeNull();
    expect(screen.getByTitle("Copy")).toBeDefined();
  });

  it("codeEl の className 未指定でも <pre> ラップ経路に入る", () => {
    const { container } = render(
      <MarkdownPre>
        <code>x</code>
      </MarkdownPre>
    );

    expect(container.querySelector("pre")).not.toBeNull();
    expect(screen.getByTitle("Copy")).toBeDefined();
  });

  it("language-mermaid の codeEl は children passthrough で <pre> を出さない", () => {
    const { container } = render(
      <MarkdownPre>
        <code className="language-mermaid">{"graph TD;A-->B"}</code>
      </MarkdownPre>
    );

    expect(screen.queryByTitle("Copy")).toBeNull();
    expect(container.querySelector("pre")).toBeNull();
    expect(container.querySelector("code.language-mermaid")).not.toBeNull();
  });

  it("プリミティブな children でも <pre> + CopyButton でラップする", () => {
    const { container } = render(<MarkdownPre>{"raw text"}</MarkdownPre>);

    const pre = container.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre?.textContent).toContain("raw text");
    expect(screen.getByTitle("Copy")).toBeDefined();
  });
});
