import type { FileNode } from "@shared/types";

import { handleFileChanged, handleTreeChanged } from "@/utils/watch-handler";

describe("watch-handler: handleFileChanged", () => {
  it("eventPath === selectedPath → fetchAndSetContent が呼ばれる", () => {
    const actions = {
      fetchAndSetContent: vi.fn(),
      setFiles: vi.fn(),
      setSelectedPath: vi.fn(),
    };

    handleFileChanged("docs/README.md", "docs/README.md", actions);

    expect(actions.fetchAndSetContent).toHaveBeenCalledWith("docs/README.md");
  });

  it("eventPath !== selectedPath → 何も呼ばれない", () => {
    const actions = {
      fetchAndSetContent: vi.fn(),
      setFiles: vi.fn(),
      setSelectedPath: vi.fn(),
    };

    handleFileChanged("docs/other.md", "docs/README.md", actions);

    expect(actions.fetchAndSetContent).not.toHaveBeenCalled();
    expect(actions.setFiles).not.toHaveBeenCalled();
    expect(actions.setSelectedPath).not.toHaveBeenCalled();
  });
});

describe("watch-handler: handleTreeChanged", () => {
  const tree: FileNode[] = [
    {
      children: [
        { name: "guide.md", path: "docs/guide.md" },
        { name: "api.md", path: "docs/api.md" },
      ],
      name: "docs",
      path: "docs",
    },
    { name: "README.md", path: "README.md" },
  ];

  it("selectedPath がツリーに存在 → setFiles のみ呼ばれる", () => {
    const actions = {
      fetchAndSetContent: vi.fn(),
      setFiles: vi.fn(),
      setSelectedPath: vi.fn(),
    };

    handleTreeChanged(tree, "docs/guide.md", actions);

    expect(actions.setFiles).toHaveBeenCalledWith(tree);
    expect(actions.setSelectedPath).not.toHaveBeenCalled();
  });

  it("selectedPath がツリーに存在しない → setFiles + setSelectedPath が呼ばれる", () => {
    const actions = {
      fetchAndSetContent: vi.fn(),
      setFiles: vi.fn(),
      setSelectedPath: vi.fn(),
    };

    handleTreeChanged(tree, "deleted.md", actions);

    expect(actions.setFiles).toHaveBeenCalledWith(tree);
    expect(actions.setSelectedPath).toHaveBeenCalledWith("docs/guide.md");
  });

  it("selectedPath が null → setFiles + setSelectedPath が呼ばれる", () => {
    const actions = {
      fetchAndSetContent: vi.fn(),
      setFiles: vi.fn(),
      setSelectedPath: vi.fn(),
    };

    handleTreeChanged(tree, null, actions);

    expect(actions.setFiles).toHaveBeenCalledWith(tree);
    expect(actions.setSelectedPath).toHaveBeenCalledWith("docs/guide.md");
  });

  it("空のツリー → setFiles + setSelectedPath(null) が呼ばれる", () => {
    const actions = {
      fetchAndSetContent: vi.fn(),
      setFiles: vi.fn(),
      setSelectedPath: vi.fn(),
    };

    handleTreeChanged([], "docs/guide.md", actions);

    expect(actions.setFiles).toHaveBeenCalledWith([]);
    expect(actions.setSelectedPath).toHaveBeenCalledWith(null);
  });
});
