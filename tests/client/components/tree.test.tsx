// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { Tree, TreeItem, TreeLeaf } from "@/components/ui/tree";

// eslint-disable-next-line no-empty-function
const noop = () => {};

describe("tree", () => {
  // eslint-disable-next-line jest/no-hooks -- jsdom cleanup required
  afterEach(() => {
    cleanup();
  });

  it("ルートコンテナが role='tree' を持つ", () => {
    render(<Tree>{null}</Tree>);

    expect(screen.getByRole("tree")).toBeDefined();
  });

  it("ディレクトリノードが role='treeitem' を持つ", () => {
    render(
      <Tree>
        <TreeItem expanded={false} name="docs" onToggle={noop} />
      </Tree>
    );

    expect(screen.getByRole("treeitem")).toBeDefined();
  });

  it("ファイルノードが role='treeitem' を持つ", () => {
    render(
      <Tree>
        <TreeLeaf name="README.md" selected={false} onSelect={noop} />
      </Tree>
    );

    expect(screen.getByRole("treeitem")).toBeDefined();
  });

  it("ディレクトリノードをクリックすると onToggle が呼ばれる", () => {
    const onToggle = vi.fn();

    render(
      <Tree>
        <TreeItem expanded={false} name="docs" onToggle={onToggle} />
      </Tree>
    );

    fireEvent.click(screen.getByText("docs"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("ファイルノードをクリックすると onSelect が呼ばれる", () => {
    const onSelect = vi.fn();

    render(
      <Tree>
        <TreeLeaf name="README.md" selected={false} onSelect={onSelect} />
      </Tree>
    );

    fireEvent.click(screen.getByText("README.md"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("展開中のディレクトリは aria-expanded='true' を持つ", () => {
    render(
      <Tree>
        <TreeItem expanded name="docs" onToggle={noop}>
          <TreeLeaf name="guide.md" selected={false} onSelect={noop} />
        </TreeItem>
      </Tree>
    );

    const dir = screen.getByRole("treeitem", { expanded: true });

    expect(dir).toBeDefined();
  });

  it("展開中のディレクトリは子要素を表示する", () => {
    render(
      <Tree>
        <TreeItem expanded name="docs" onToggle={noop}>
          <TreeLeaf name="guide.md" selected={false} onSelect={noop} />
        </TreeItem>
      </Tree>
    );

    expect(screen.getByText("guide.md")).toBeDefined();
  });

  it("折畳み中のディレクトリは aria-expanded='false' を持つ", () => {
    render(
      <Tree>
        <TreeItem expanded={false} name="docs" onToggle={noop}>
          <TreeLeaf name="guide.md" selected={false} onSelect={noop} />
        </TreeItem>
      </Tree>
    );

    const dir = screen.getByRole("treeitem", { expanded: false });

    expect(dir).toBeDefined();
  });

  it("折畳み中のディレクトリは子要素を表示しない", () => {
    render(
      <Tree>
        <TreeItem expanded={false} name="docs" onToggle={noop}>
          <TreeLeaf name="guide.md" selected={false} onSelect={noop} />
        </TreeItem>
      </Tree>
    );

    expect(screen.queryByText("guide.md")).toBeNull();
  });

  it("選択中のファイルは aria-selected='true' を持つ", () => {
    render(
      <Tree>
        <TreeLeaf name="README.md" selected onSelect={noop} />
        <TreeLeaf name="other.md" selected={false} onSelect={noop} />
      </Tree>
    );

    const items = screen.getAllByRole("treeitem");
    const selected = items.find(
      (item) => item.getAttribute("aria-selected") === "true"
    );

    expect(selected).toBeDefined();
  });

  it("未選択のファイルは aria-selected='false' を持つ", () => {
    render(
      <Tree>
        <TreeLeaf name="README.md" selected onSelect={noop} />
        <TreeLeaf name="other.md" selected={false} onSelect={noop} />
      </Tree>
    );

    const items = screen.getAllByRole("treeitem");
    const unselected = items.find(
      (item) => item.getAttribute("aria-selected") === "false"
    );

    expect(unselected).toBeDefined();
  });

  it("ディレクトリ名・ファイル名がテキストとして表示される", () => {
    render(
      <Tree>
        <TreeItem expanded name="src" onToggle={noop}>
          <TreeLeaf name="index.ts" selected={false} onSelect={noop} />
        </TreeItem>
      </Tree>
    );

    expect(screen.getByText("src")).toBeDefined();
    expect(screen.getByText("index.ts")).toBeDefined();
  });
});
