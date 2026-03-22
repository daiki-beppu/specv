// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { MdLink } from "@/components/markdown/md-link";

describe("MdLink", () => {
  // eslint-disable-next-line jest/no-hooks -- jsdom cleanup required
  afterEach(() => {
    cleanup();
  });

  it(".md リンク + selectedPath あり → クリックで onNavigate が解決済みパスで呼ばれる", () => {
    const onNavigate = vi.fn();

    render(
      <MdLink
        href="./other.md"
        selectedPath="docs/readme.md"
        onNavigate={onNavigate}
      >
        Link
      </MdLink>
    );

    fireEvent.click(screen.getByText("Link"));

    // resolvePath("docs/readme.md", "./other.md") → "docs/other.md"
    expect(onNavigate).toHaveBeenCalledWith("docs/other.md");
  });

  it(".md リンク + selectedPath なし → 外部リンクとして表示", () => {
    const onNavigate = vi.fn();

    render(
      <MdLink href="./other.md" selectedPath={null} onNavigate={onNavigate}>
        Link
      </MdLink>
    );

    const link = screen.getByText("Link");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("外部リンク → target='_blank' + rel='noopener noreferrer' が付与される", () => {
    const onNavigate = vi.fn();

    render(
      <MdLink
        href="https://example.com"
        selectedPath="docs/readme.md"
        onNavigate={onNavigate}
      >
        External
      </MdLink>
    );

    const link = screen.getByText("External");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });
});
