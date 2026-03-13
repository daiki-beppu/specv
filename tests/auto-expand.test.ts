import type { FileNode } from "@shared/types.js";

import { computeAutoExpandPaths, findNode } from "@/utils/auto-expand.js";

// eslint-disable-next-line jest/valid-title -- oxfmt reverts string to function reference
describe(computeAutoExpandPaths, () => {
  it("空ツリーで空の Set を返す", () => {
    const result = computeAutoExpandPaths([]);
    expect(result).toStrictEqual(new Set());
  });

  it("単一ディレクトリ docs/file.md → docs が展開される", () => {
    const files: FileNode[] = [
      {
        children: [{ name: "file.md", path: "docs/file.md" }],
        name: "docs",
        path: "docs",
      },
    ];
    const result = computeAutoExpandPaths(files);
    expect(result).toStrictEqual(new Set(["docs"]));
  });

  it("ルートに .md ファイルのみ → 空の Set", () => {
    const files: FileNode[] = [{ name: "README.md", path: "README.md" }];
    const result = computeAutoExpandPaths(files);
    expect(result).toStrictEqual(new Set());
  });

  it("連続単一パス a/b/file.md → a と a/b が展開される", () => {
    const files: FileNode[] = [
      {
        children: [
          {
            children: [{ name: "file.md", path: "a/b/file.md" }],
            name: "b",
            path: "a/b",
          },
        ],
        name: "a",
        path: "a",
      },
    ];
    const result = computeAutoExpandPaths(files);
    expect(result).toStrictEqual(new Set(["a", "a/b"]));
  });

  it("分岐で停止 — docs/ と api/ の両方に .md → 空の Set", () => {
    const files: FileNode[] = [
      {
        children: [{ name: "file.md", path: "docs/file.md" }],
        name: "docs",
        path: "docs",
      },
      {
        children: [{ name: "file.md", path: "api/file.md" }],
        name: "api",
        path: "api",
      },
    ];
    const result = computeAutoExpandPaths(files);
    expect(result).toStrictEqual(new Set());
  });

  it("混合 — ルートに1ディレクトリ、その中に2ディレクトリ → ルートのみ展開", () => {
    const files: FileNode[] = [
      {
        children: [
          {
            children: [{ name: "a.md", path: "docs/guides/a.md" }],
            name: "guides",
            path: "docs/guides",
          },
          {
            children: [{ name: "b.md", path: "docs/api/b.md" }],
            name: "api",
            path: "docs/api",
          },
        ],
        name: "docs",
        path: "docs",
      },
    ];
    const result = computeAutoExpandPaths(files);
    expect(result).toStrictEqual(new Set(["docs"]));
  });

  it("ディレクトリ + ルートの .md → ディレクトリが展開される", () => {
    const files: FileNode[] = [
      { name: "README.md", path: "README.md" },
      {
        children: [{ name: "file.md", path: "docs/file.md" }],
        name: "docs",
        path: "docs",
      },
    ];
    const result = computeAutoExpandPaths(files);
    expect(result).toStrictEqual(new Set(["docs"]));
  });
});

// eslint-disable-next-line jest/valid-title -- oxfmt reverts string to function reference
describe(findNode, () => {
  const tree: FileNode[] = [
    {
      children: [
        {
          children: [{ name: "a.md", path: "docs/guides/a.md" }],
          name: "guides",
          path: "docs/guides",
        },
      ],
      name: "docs",
      path: "docs",
    },
    { name: "README.md", path: "README.md" },
  ];

  it("存在するトップレベルのパスを見つける", () => {
    const node = findNode(tree, "docs");
    expect(node).toBeDefined();
    expect(node?.path).toBe("docs");
  });

  it("存在しないパスで undefined を返す", () => {
    const node = findNode(tree, "nonexistent");
    expect(node).toBeUndefined();
  });

  it("ネストされたパスを見つける", () => {
    const node = findNode(tree, "docs/guides");
    expect(node).toBeDefined();
    expect(node?.path).toBe("docs/guides");
  });
});
