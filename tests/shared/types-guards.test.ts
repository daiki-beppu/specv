import {
  isFileChangedPayload,
  isFileNode,
  isFilesResponse,
  isTreeChangedPayload,
} from "@shared/types";

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(isFileNode, () => {
  it("path/name のみの最小 shape を受理する", () => {
    const value: unknown = { name: "a.md", path: "a.md" };

    expect(isFileNode(value)).toBe(true);
  });

  it("children に有効な FileNode 配列を持つとき受理する", () => {
    const value: unknown = {
      children: [
        { name: "a.md", path: "docs/a.md" },
        { name: "b.md", path: "docs/b.md" },
      ],
      name: "docs",
      path: "docs",
    };

    expect(isFileNode(value)).toBe(true);
  });

  it("children が空配列でも受理する", () => {
    const value: unknown = { children: [], name: "docs", path: "docs" };

    expect(isFileNode(value)).toBe(true);
  });

  it("path が欠落しているとき false を返す", () => {
    const value: unknown = { name: "a.md" };

    expect(isFileNode(value)).toBe(false);
  });

  it("name が欠落しているとき false を返す", () => {
    const value: unknown = { path: "a.md" };

    expect(isFileNode(value)).toBe(false);
  });

  it("path が string でないとき false を返す", () => {
    const value: unknown = { name: "a.md", path: 1 };

    expect(isFileNode(value)).toBe(false);
  });

  it("name が string でないとき false を返す", () => {
    const value: unknown = { name: 1, path: "a.md" };

    expect(isFileNode(value)).toBe(false);
  });

  it("children が配列でないとき false を返す", () => {
    const value: unknown = { children: "x", name: "docs", path: "docs" };

    expect(isFileNode(value)).toBe(false);
  });

  it("children の要素が FileNode でないとき false を返す", () => {
    const value: unknown = {
      children: [{ name: "x.md", path: 1 }],
      name: "docs",
      path: "docs",
    };

    expect(isFileNode(value)).toBe(false);
  });

  it.each([
    { input: null, label: "null" },
    { input: undefined, label: "undefined" },
    { input: "x", label: "string" },
    { input: 1, label: "number" },
    { input: true, label: "boolean" },
  ])("$label のとき false を返す", ({ input }) => {
    expect(isFileNode(input)).toBe(false);
  });
});

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(isFilesResponse, () => {
  it("files が FileNode 配列のとき true を返す", () => {
    const value: unknown = { files: [{ name: "a.md", path: "a.md" }] };

    expect(isFilesResponse(value)).toBe(true);
  });

  it("files が空配列のとき true を返す", () => {
    const value: unknown = { files: [] };

    expect(isFilesResponse(value)).toBe(true);
  });

  it("files が配列でないとき false を返す", () => {
    const value: unknown = { files: "x" };

    expect(isFilesResponse(value)).toBe(false);
  });

  it("files プロパティが欠落しているとき false を返す", () => {
    const value: unknown = {};

    expect(isFilesResponse(value)).toBe(false);
  });

  it("files の要素が FileNode でないとき false を返す", () => {
    const value: unknown = { files: [{ path: 1 }] };

    expect(isFilesResponse(value)).toBe(false);
  });
});

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(isFileChangedPayload, () => {
  it("path が string のとき true を返す", () => {
    const value: unknown = { path: "a.md" };

    expect(isFileChangedPayload(value)).toBe(true);
  });

  it("path が string でないとき false を返す", () => {
    const value: unknown = { path: 123 };

    expect(isFileChangedPayload(value)).toBe(false);
  });

  it("path プロパティが欠落しているとき false を返す", () => {
    const value: unknown = {};

    expect(isFileChangedPayload(value)).toBe(false);
  });
});

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(isTreeChangedPayload, () => {
  it("files が FileNode 配列のとき true を返す", () => {
    const value: unknown = { files: [{ name: "a.md", path: "a.md" }] };

    expect(isTreeChangedPayload(value)).toBe(true);
  });

  it("files が配列でないとき false を返す", () => {
    const value: unknown = { files: "x" };

    expect(isTreeChangedPayload(value)).toBe(false);
  });

  it("files の要素が FileNode でないとき false を返す", () => {
    const value: unknown = { files: [{ name: "x", path: 1 }] };

    expect(isTreeChangedPayload(value)).toBe(false);
  });
});
