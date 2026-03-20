// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";

import { useScrollRestore } from "@/hooks/use-scroll-restore";

describe("hook: useScrollRestore", () => {
  it("selectedPath 変更時 → scrollTop = 0", () => {
    const scrollRef = { current: { scrollTop: 150 } };

    const { rerender } = renderHook(
      ({ selectedPath }) =>
        useScrollRestore(
          scrollRef as unknown as React.RefObject<HTMLDivElement>,
          selectedPath
        ),
      { initialProps: { selectedPath: "a.md" } }
    );

    rerender({ selectedPath: "b.md" });
    expect(scrollRef.current.scrollTop).toBe(0);
  });

  it("同一パスの再レンダリング → scrollTop が変更されない", () => {
    const scrollRef = { current: { scrollTop: 200 } };

    const { rerender } = renderHook(
      ({ selectedPath }) =>
        useScrollRestore(
          scrollRef as unknown as React.RefObject<HTMLDivElement>,
          selectedPath
        ),
      { initialProps: { selectedPath: "a.md" } }
    );

    rerender({ selectedPath: "a.md" });
    expect(scrollRef.current.scrollTop).toBe(200);
  });
});
