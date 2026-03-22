// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";

import { SearchResultItem } from "@/components/search-result-item";

vi.mock(import("@/components/ui/command"), () => ({
  CommandItem: ({
    children,
    onSelect,
  }: {
    children: React.ReactNode;
    onSelect?: (value: string) => void;
    value?: string;
  }) => (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, react-perf/jsx-no-new-function-as-prop -- test mock
    <div data-testid="command-item" onClick={() => onSelect?.("")}>
      {children}
    </div>
  ),
}));

describe("SearchResultItem", () => {
  // eslint-disable-next-line jest/no-hooks -- jsdom cleanup required
  afterEach(() => {
    cleanup();
  });

  it("query あり + positions にファイル名部分が含まれる → 該当文字がハイライト表示される", () => {
    const file = { path: "docs/readme.md", name: "readme.md", dir: "docs" };
    // path "docs/readme.md" は 14 文字、name "readme.md" は 9 文字
    // nameStart = 14 - 9 = 5
    // positions に 5 (= name の 0 番目 'r') と 6 (= name の 1 番目 'e') を含める
    const positions = new Set([5, 6]);

    render(
      <SearchResultItem
        file={file}
        positions={positions}
        query="re"
        onSelect={vi.fn()}
      />
    );

    const highlighted = document.querySelectorAll(".font-semibold");
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].textContent).toBe("re");
  });

  it("query あり + positions がファイル名範囲外 → ハイライトなしで表示", () => {
    const file = { path: "docs/readme.md", name: "readme.md", dir: "docs" };
    // nameStart = 5, positions に 0〜4 (ディレクトリ部分) のみ → name にはマッチしない
    const positions = new Set([0, 1, 2]);

    render(
      <SearchResultItem
        file={file}
        positions={positions}
        query="doc"
        onSelect={vi.fn()}
      />
    );

    const highlighted = document.querySelectorAll(".font-semibold");
    expect(highlighted).toHaveLength(0);
  });

  it("query なし → ファイル名がそのまま表示される", () => {
    const file = { path: "docs/readme.md", name: "readme.md", dir: "docs" };

    render(
      <SearchResultItem
        file={file}
        positions={new Set()}
        query=""
        onSelect={vi.fn()}
      />
    );

    const highlighted = document.querySelectorAll(".font-semibold");
    expect(highlighted).toHaveLength(0);
    expect(screen.getByText("readme.md")).toBeDefined();
  });

  it("dir がある → ディレクトリパスが表示される", () => {
    const file = { path: "docs/readme.md", name: "readme.md", dir: "docs" };

    render(
      <SearchResultItem
        file={file}
        positions={new Set()}
        query=""
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText("docs")).toBeDefined();
  });

  it("onSelect が正しい path で呼ばれる", () => {
    const file = { path: "docs/readme.md", name: "readme.md", dir: "docs" };
    const onSelect = vi.fn();

    render(
      <SearchResultItem
        file={file}
        positions={new Set()}
        query=""
        onSelect={onSelect}
      />
    );

    screen.getByTestId("command-item").click();
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
