// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { FileTree } from "@/components/file-tree";

// eslint-disable-next-line no-empty-function
const noop = () => {};

const sampleFiles = [
  {
    children: [{ name: "guide.md", path: "docs/guide.md" }],
    name: "docs",
    path: "docs",
  },
  { name: "README.md", path: "README.md" },
];

describe("file-tree", () => {
  // eslint-disable-next-line jest/no-hooks -- jsdom cleanup required
  afterEach(() => {
    cleanup();
  });

  it("ディレクトリとファイルが表示される", () => {
    render(
      <FileTree files={sampleFiles} selectedPath={null} onSelect={noop} />
    );

    expect(screen.getByText("docs")).toBeDefined();
    expect(screen.getByText("README.md")).toBeDefined();
  });

  it("ディレクトリをクリックすると折畳まれる", () => {
    render(
      <FileTree files={sampleFiles} selectedPath={null} onSelect={noop} />
    );

    fireEvent.click(screen.getByText("docs"));

    expect(screen.queryByText("guide.md")).toBeNull();
  });

  it("折畳まれたディレクトリをクリックすると展開する", () => {
    render(
      <FileTree files={sampleFiles} selectedPath={null} onSelect={noop} />
    );
    fireEvent.click(screen.getByText("docs"));

    fireEvent.click(screen.getByText("docs"));

    expect(screen.getByText("guide.md")).toBeDefined();
  });

  it("ファイルをクリックすると onSelect が呼ばれる", () => {
    const onSelect = vi.fn();

    render(
      <FileTree files={sampleFiles} selectedPath={null} onSelect={onSelect} />
    );

    fireEvent.click(screen.getByText("README.md"));
    expect(onSelect).toHaveBeenCalledWith("README.md");
  });

  it("選択中のファイルが aria-selected='true' で区別できる", () => {
    render(
      <FileTree files={sampleFiles} selectedPath="README.md" onSelect={noop} />
    );

    const items = screen.getAllByRole("treeitem");
    const selected = items.find(
      (item) => item.getAttribute("aria-selected") === "true"
    );

    expect(selected).toBeDefined();
    expect(selected?.textContent).toContain("README.md");
  });

  it("検索クエリにマッチしたファイルが表示される", () => {
    render(
      <FileTree files={sampleFiles} selectedPath={null} onSelect={noop} />
    );

    const searchInput = screen.getByPlaceholderText("Search files...");
    fireEvent.change(searchInput, { target: { value: "guide" } });

    expect(screen.getByText("guide.md")).toBeDefined();
  });

  it("検索クエリにマッチしないファイルは非表示になる", () => {
    render(
      <FileTree files={sampleFiles} selectedPath={null} onSelect={noop} />
    );

    const searchInput = screen.getByPlaceholderText("Search files...");
    fireEvent.change(searchInput, { target: { value: "guide" } });

    expect(screen.queryByText("README.md")).toBeNull();
  });

  it("検索時にマッチしたファイルの親ディレクトリが自動展開される", () => {
    const deepFiles = [
      {
        children: [
          {
            children: [{ name: "deep.md", path: "a/b/deep.md" }],
            name: "b",
            path: "a/b",
          },
        ],
        name: "a",
        path: "a",
      },
    ];

    render(<FileTree files={deepFiles} selectedPath={null} onSelect={noop} />);

    const searchInput = screen.getByPlaceholderText("Search files...");
    fireEvent.change(searchInput, { target: { value: "deep" } });

    expect(screen.getByText("deep.md")).toBeDefined();
  });

  it("キーボードショートカット表示（⌘P）が見える", () => {
    render(
      <FileTree files={sampleFiles} selectedPath={null} onSelect={noop} />
    );

    expect(screen.getByText("⌘")).toBeDefined();
    expect(screen.getByText("P")).toBeDefined();
  });
});
