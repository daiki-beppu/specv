// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";

import { useServerStatus } from "@/hooks/use-server-status";

import { EventSourceMock } from "../../test-utils";

beforeEach(() => {
  EventSourceMock.reset();
  vi.stubGlobal("EventSource", EventSourceMock);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(useServerStatus, () => {
  it("初期状態は connecting", () => {
    const { result } = renderHook(() => useServerStatus());

    expect(result.current).toBe("connecting");
  });

  it('mount で EventSource("/api/lifecycle") を生成する', () => {
    renderHook(() => useServerStatus());

    expect(EventSourceMock.instances).toHaveLength(1);
    expect(EventSourceMock.last.url).toBe("/api/lifecycle");
  });

  it("open イベントで connected になる", () => {
    const { result } = renderHook(() => useServerStatus());

    act(() => {
      EventSourceMock.last.dispatch("open");
    });

    expect(result.current).toBe("connected");
  });

  it("error イベントで disconnected になる", () => {
    const { result } = renderHook(() => useServerStatus());

    act(() => {
      EventSourceMock.last.dispatch("error");
    });

    expect(result.current).toBe("disconnected");
  });

  it("error 後に open すると connected へ復帰する（自動再接続の表現）", () => {
    const { result } = renderHook(() => useServerStatus());

    act(() => {
      EventSourceMock.last.dispatch("error");
    });
    act(() => {
      EventSourceMock.last.dispatch("open");
    });

    expect(result.current).toBe("connected");
  });

  it("unmount で EventSource.close() が呼ばれる", () => {
    const { unmount } = renderHook(() => useServerStatus());
    const es = EventSourceMock.last;

    unmount();

    expect(es.close).toHaveBeenCalledTimes(1);
  });
});
