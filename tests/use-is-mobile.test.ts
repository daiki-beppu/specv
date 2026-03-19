// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";

import { useIsMobile } from "@/hooks/use-is-mobile";

function createMockMatchMedia(matches: boolean) {
  const listeners: Array<(e: { matches: boolean }) => void> = [];
  const mql = {
    addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
      listeners.push(cb);
    },
    matches,
    removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
      const idx = listeners.indexOf(cb);
      if (idx >= 0) listeners.splice(idx, 1);
    },
  };
  window.matchMedia = vi.fn().mockReturnValue(mql) as typeof window.matchMedia;
  return {
    mql,
    trigger: (newMatches: boolean) => {
      mql.matches = newMatches;
      for (const cb of listeners) cb({ matches: newMatches });
    },
  };
}

describe("hook: useIsMobile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("デスクトップ幅 → false を返す", () => {
    createMockMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("モバイル幅 → true を返す", () => {
    createMockMatchMedia(true);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("リサイズでリアクティブに更新される", () => {
    const { trigger } = createMockMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      trigger(true);
    });
    expect(result.current).toBe(true);

    act(() => {
      trigger(false);
    });
    expect(result.current).toBe(false);
  });

  it("アンマウント時にリスナーが解除される", () => {
    const { mql } = createMockMatchMedia(false);
    const removeSpy = vi.spyOn(mql, "removeEventListener");
    const { unmount } = renderHook(() => useIsMobile());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
