import type {
  FileChangedPayload,
  FileNode,
  FilesResponse,
  TreeChangedPayload,
  WatchEventName,
} from "@shared/types";

describe("shared types: FilesResponse", () => {
  it("`{ files: FileNode[] }` と等価な型である", () => {
    expectTypeOf<FilesResponse>().toEqualTypeOf<{ files: FileNode[] }>();
  });

  it("`files` プロパティが `FileNode[]` と等価である", () => {
    expectTypeOf<FilesResponse["files"]>().toEqualTypeOf<FileNode[]>();
  });

  it("`files` を欠いたオブジェクトを代入できない", () => {
    // @ts-expect-error: FilesResponse は files プロパティを必須とする
    const invalid: FilesResponse = {};
    expectTypeOf(invalid).toMatchTypeOf<FilesResponse>();
  });
});

describe("shared types: FileChangedPayload", () => {
  it("`{ path: string }` と等価な型である", () => {
    expectTypeOf<FileChangedPayload>().toEqualTypeOf<{ path: string }>();
  });

  it("`path` を欠いたオブジェクトを代入できない", () => {
    // @ts-expect-error: FileChangedPayload は path プロパティを必須とする
    const invalid: FileChangedPayload = {};
    expectTypeOf(invalid).toMatchTypeOf<FileChangedPayload>();
  });
});

describe("shared types: TreeChangedPayload", () => {
  it("`{ files: FileNode[] }` と等価な型である", () => {
    expectTypeOf<TreeChangedPayload>().toEqualTypeOf<{ files: FileNode[] }>();
  });

  it("`files` を欠いたオブジェクトを代入できない", () => {
    // @ts-expect-error: TreeChangedPayload は files プロパティを必須とする
    const invalid: TreeChangedPayload = {};
    expectTypeOf(invalid).toMatchTypeOf<TreeChangedPayload>();
  });
});

describe("shared types: WatchEventName", () => {
  it('`"file-changed" | "tree-changed"` と等価な union である', () => {
    expectTypeOf<WatchEventName>().toEqualTypeOf<
      "file-changed" | "tree-changed"
    >();
  });

  it('`"file-changed"` リテラルが代入互換である', () => {
    const name: WatchEventName = "file-changed";
    expectTypeOf(name).toMatchTypeOf<WatchEventName>();
  });

  it('`"tree-changed"` リテラルが代入互換である', () => {
    const name: WatchEventName = "tree-changed";
    expectTypeOf(name).toMatchTypeOf<WatchEventName>();
  });

  it("未定義イベント名のリテラルを代入できない", () => {
    // @ts-expect-error: WatchEventName は "file-renamed" を含まない
    const invalid: WatchEventName = "file-renamed";
    expectTypeOf(invalid).toMatchTypeOf<WatchEventName>();
  });
});
