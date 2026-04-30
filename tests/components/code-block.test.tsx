// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";

import { CodeBlock } from "@/components/code-block";

vi.mock(import("@/hooks/use-theme"), () => ({
  useTheme: () => ({ theme: "light" as const, toggle: vi.fn() }),
}));

vi.mock(import("mermaid"), () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({
      bindFunctions: vi.fn(),
      svg: '<svg data-testid="mermaid-svg">mock</svg>',
    }),
  },
}));

const SAMPLE_TS = "const x = 1;";

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(CodeBlock, () => {
  // eslint-disable-next-line jest/no-hooks -- jsdom cleanup required
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("language-ts クラスで Highlight 経路の <code> をレンダーする", () => {
    const { container } = render(
      <CodeBlock className="language-ts">{SAMPLE_TS}</CodeBlock>
    );

    expect(container.querySelector("code.language-ts")).not.toBeNull();
    expect(container.querySelector("code > span")).not.toBeNull();
  });

  it("className 未指定で素の <code> を返し Highlight 経路に入らない", () => {
    const { container } = render(<CodeBlock>plain</CodeBlock>);

    expect(screen.getByText("plain")).toBeDefined();
    expect(container.querySelector("code > span")).toBeNull();
  });

  it('className="" で素の <code> を返し Highlight 経路に入らない', () => {
    const { container } = render(<CodeBlock className="">plain</CodeBlock>);

    expect(screen.getByText("plain")).toBeDefined();
    expect(container.querySelector("code > span")).toBeNull();
  });

  it("language-mermaid クラスで MermaidBlock を Suspense 経由で描画する", async () => {
    render(
      <CodeBlock className="language-mermaid">{"graph TD;A-->B"}</CodeBlock>
    );

    await waitFor(() => {
      expect(screen.getByTestId("mermaid-svg")).toBeDefined();
    });
  });

  it("language- 接頭辞を含まない className で素の <code> を返す", () => {
    const { container } = render(
      <CodeBlock className="weird-class">plain</CodeBlock>
    );

    expect(screen.getByText("plain")).toBeDefined();
    expect(container.querySelector("code > span")).toBeNull();
  });
});
