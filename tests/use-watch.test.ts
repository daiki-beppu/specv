// @vitest-environment jsdom
import type { FileNode } from "@shared/types";
import { act, renderHook, waitFor } from "@testing-library/react";

import { useWatch } from "@/hooks/use-watch";
import { logError } from "@/lib/logger";

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

interface MockEventLike {
  data: string;
}

class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  close = vi.fn();
  private listeners = new Map<string, ((e: MockEventLike) => void)[]>();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, cb: (e: MockEventLike) => void) {
    const arr = this.listeners.get(type) ?? [];
    arr.push(cb);
    this.listeners.set(type, arr);
  }

  dispatch(type: string, data: unknown) {
    const cbs = this.listeners.get(type) ?? [];
    for (const cb of cbs) {
      cb({ data: JSON.stringify(data) });
    }
  }

  static get last(): MockEventSource {
    const inst = MockEventSource.instances.at(-1);
    if (!inst) {
      throw new Error("MockEventSource has not been instantiated");
    }
    return inst;
  }

  static reset() {
    MockEventSource.instances = [];
  }
}

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

beforeEach(() => {
  MockEventSource.reset();
  vi.stubGlobal("EventSource", MockEventSource);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(useWatch, () => {
  it('mount で EventSource("/api/watch") が生成される', () => {
    renderHook(() => useWatch("docs/guide.md", vi.fn(), vi.fn(), vi.fn()));

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.last.url).toBe("/api/watch");
  });

  it("file-changed の path が selectedPath と一致するとき fetchFile + setContent が呼ばれる", async () => {
    const body = "# Updated";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(body, { status: 200 }));
    const setContent = vi.fn();

    renderHook(() => useWatch("docs/guide.md", setContent, vi.fn(), vi.fn()));
    act(() => {
      MockEventSource.last.dispatch("file-changed", { path: "docs/guide.md" });
    });

    await waitFor(() => {
      expect(setContent).toHaveBeenCalledWith(body);
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      `/api/file?path=${encodeURIComponent("docs/guide.md")}`
    );
  });

  it("tree-changed event で setFiles が新しい files で呼ばれる", () => {
    const setFiles = vi.fn();

    renderHook(() => useWatch("docs/guide.md", vi.fn(), setFiles, vi.fn()));
    act(() => {
      MockEventSource.last.dispatch("tree-changed", { files: tree });
    });

    expect(setFiles).toHaveBeenCalledWith(tree);
  });

  it("unmount で EventSource.close() が呼ばれる", () => {
    const { unmount } = renderHook(() =>
      useWatch("docs/guide.md", vi.fn(), vi.fn(), vi.fn())
    );
    const es = MockEventSource.last;

    unmount();

    expect(es.close).toHaveBeenCalledTimes(1);
  });

  it("file-changed の path が selectedPath と一致しないとき fetchFile/setContent は呼ばれない", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const setContent = vi.fn();

    renderHook(() => useWatch("docs/guide.md", setContent, vi.fn(), vi.fn()));
    act(() => {
      MockEventSource.last.dispatch("file-changed", { path: "docs/api.md" });
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setContent).not.toHaveBeenCalled();
  });

  it("tree-changed event で selectedPath がツリー内に存在するとき setSelectedPath は呼ばれない", () => {
    const setSelectedPath = vi.fn();

    renderHook(() =>
      useWatch("docs/guide.md", vi.fn(), vi.fn(), setSelectedPath)
    );
    act(() => {
      MockEventSource.last.dispatch("tree-changed", { files: tree });
    });

    expect(setSelectedPath).not.toHaveBeenCalled();
  });

  it("tree-changed event で selectedPath がツリー外のとき setSelectedPath(firstFile) が呼ばれる", () => {
    const setSelectedPath = vi.fn();

    renderHook(() => useWatch("deleted.md", vi.fn(), vi.fn(), setSelectedPath));
    act(() => {
      MockEventSource.last.dispatch("tree-changed", { files: tree });
    });

    expect(setSelectedPath).toHaveBeenCalledWith("docs/guide.md");
  });

  it("tree-changed event で selectedPath が null のとき setSelectedPath(firstFile) が呼ばれる", () => {
    const setSelectedPath = vi.fn();

    renderHook(() => useWatch(null, vi.fn(), vi.fn(), setSelectedPath));
    act(() => {
      MockEventSource.last.dispatch("tree-changed", { files: tree });
    });

    expect(setSelectedPath).toHaveBeenCalledWith("docs/guide.md");
  });

  it("selectedPath を rerender で変更しても EventSource は再生成されない", () => {
    // useEffect 依存に渡す setter 参照は rerender 間で安定させる
    const setContent = vi.fn();
    const setFiles = vi.fn();
    const setSelectedPath = vi.fn();
    const { rerender } = renderHook(
      ({ selectedPath }: { selectedPath: string | null }) =>
        useWatch(selectedPath, setContent, setFiles, setSelectedPath),
      { initialProps: { selectedPath: "docs/guide.md" } }
    );
    expect(MockEventSource.instances).toHaveLength(1);

    rerender({ selectedPath: "docs/api.md" });

    expect(MockEventSource.instances).toHaveLength(1);
  });

  it("fetchFile が reject したとき logError が呼ばれ setContent は呼ばれない", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new TypeError("Failed to fetch")
    );
    const setContent = vi.fn();

    renderHook(() => useWatch("docs/guide.md", setContent, vi.fn(), vi.fn()));
    act(() => {
      MockEventSource.last.dispatch("file-changed", { path: "docs/guide.md" });
    });

    await waitFor(() => {
      expect(logError).toHaveBeenCalled();
    });
    expect(setContent).not.toHaveBeenCalled();
  });
});
