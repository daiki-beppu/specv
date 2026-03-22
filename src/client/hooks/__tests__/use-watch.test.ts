// @vitest-environment jsdom
import { renderHook, cleanup } from "@testing-library/react";

import { useWatch } from "@/hooks/use-watch";

vi.mock(import("@/api"), () => ({
  fetchFile: vi.fn().mockResolvedValue("# Updated content"),
  fetchFiles: vi.fn(),
}));

type Listener = (e: MessageEvent) => void;

class MockEventSource {
  static instance: MockEventSource | null = null;
  url: string;
  listeners: Record<string, Listener[]> = {};
  closed = false;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instance = this;
  }

  addEventListener(event: string, listener: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  close() {
    this.closed = true;
    this.listeners = {};
  }

  emit(event: string, data: unknown) {
    for (const listener of this.listeners[event] ?? []) {
      listener({ data: JSON.stringify(data) } as MessageEvent);
    }
  }
}

describe("useWatch", () => {
  // eslint-disable-next-line jest/no-hooks -- jsdom setup/cleanup required
  beforeEach(() => {
    MockEventSource.instance = null;
    vi.stubGlobal("EventSource", MockEventSource);
  });

  // eslint-disable-next-line jest/no-hooks -- jsdom cleanup required
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });
  it("マウント時に EventSource が /api/watch で生成される", () => {
    renderHook(() => useWatch("docs/readme.md", vi.fn(), vi.fn(), vi.fn()));

    expect(MockEventSource.instance).not.toBeNull();
    expect(MockEventSource.instance!.url).toBe("/api/watch");
  });

  it("file-changed イベント受信 → 選択中ファイルの内容が再取得される", async () => {
    const setContent = vi.fn();
    const { fetchFile } = await import("@/api");

    renderHook(() => useWatch("docs/readme.md", setContent, vi.fn(), vi.fn()));

    MockEventSource.instance!.emit("file-changed", {
      path: "docs/readme.md",
    });

    await vi.waitFor(() => {
      expect(fetchFile).toHaveBeenCalledWith("docs/readme.md");
    });
  });

  it("tree-changed イベント受信 → ファイルツリーが更新される", () => {
    const setFiles = vi.fn();
    const files = [{ name: "README.md", path: "README.md" }];

    renderHook(() => useWatch("README.md", vi.fn(), setFiles, vi.fn()));

    MockEventSource.instance!.emit("tree-changed", { files });

    expect(setFiles).toHaveBeenCalledWith(files);
  });

  it("アンマウント時に EventSource が閉じられる", () => {
    const { unmount } = renderHook(() =>
      useWatch("docs/readme.md", vi.fn(), vi.fn(), vi.fn())
    );

    const es = MockEventSource.instance!;
    expect(es.closed).toBe(false);

    unmount();

    expect(es.closed).toBe(true);
  });
});
