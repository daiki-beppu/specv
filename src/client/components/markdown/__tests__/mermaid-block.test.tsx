// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";

vi.mock(import("mermaid"));
vi.mock(import("@/hooks/use-theme.js"));

describe("mermaidBlock", () => {
  let mockTheme: string;

  // eslint-disable-next-line jest/no-hooks -- mock setup, module reset, and jsdom cleanup required
  beforeEach(async () => {
    vi.resetModules();
    mockTheme = "light";

    const mermaid = await import("mermaid");
    vi.mocked(mermaid.default.initialize).mockReturnValue();
    vi.mocked(mermaid.default.render).mockResolvedValue({
      bindFunctions: vi.fn(),
      svg: '<svg data-testid="mermaid-svg">mock diagram</svg>',
    });

    const themeModule = await import("@/hooks/use-theme.js");
    vi.mocked(themeModule.useTheme).mockImplementation(() => ({
      theme: mockTheme as "light" | "dark",
      toggle: vi.fn(),
    }));
  });

  // eslint-disable-next-line jest/no-hooks -- jsdom cleanup required
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("mermaid.render を呼び出して svg を表示する", async () => {
    const mermaid = await import("mermaid");
    const { default: MermaidBlock } =
      await import("@/components/markdown/mermaid-block.js");

    render(<MermaidBlock code="graph TD; A-->B" />);

    await waitFor(() => {
      expect(mermaid.default.render).toHaveBeenCalledWith(
        expect.any(String),
        "graph TD; A-->B"
      );
    });

    const container = screen.getByTestId("mermaid-svg");
    expect(container).toBeDefined();
  });

  it("ライトテーマで mermaid を default テーマで初期化する", async () => {
    mockTheme = "light";
    const mermaid = await import("mermaid");
    const { default: MermaidBlock } =
      await import("@/components/markdown/mermaid-block.js");

    render(<MermaidBlock code="graph TD; A-->B" />);

    await waitFor(() => {
      expect(mermaid.default.initialize).toHaveBeenCalledWith(
        expect.objectContaining({ theme: "default" })
      );
    });
  });

  it("ダークテーマで mermaid を dark テーマで初期化する", async () => {
    mockTheme = "dark";
    const themeModule = await import("@/hooks/use-theme.js");
    vi.mocked(themeModule.useTheme).mockReturnValue({
      theme: "dark",
      toggle: vi.fn(),
    });

    const mermaid = await import("mermaid");
    const { default: MermaidBlock } =
      await import("@/components/markdown/mermaid-block.js");

    render(<MermaidBlock code="graph TD; A-->B" />);

    await waitFor(() => {
      expect(mermaid.default.initialize).toHaveBeenCalledWith(
        expect.objectContaining({ theme: "dark" })
      );
    });
  });

  it("render エラー時にコードブロックをフォールバック表示する", async () => {
    const mermaid = await import("mermaid");
    vi.mocked(mermaid.default.render).mockRejectedValueOnce(
      new Error("parse error")
    );
    const { default: MermaidBlock } =
      await import("@/components/markdown/mermaid-block.js");

    render(<MermaidBlock code="invalid mermaid" />);

    await waitFor(() => {
      const codeBlock = screen.getByText("invalid mermaid");
      expect(codeBlock).toBeDefined();
      expect(codeBlock.tagName).toBe("CODE");
    });
  });
});
