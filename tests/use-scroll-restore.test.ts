// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import type React from "react";

import { useScrollRestore } from "@/hooks/use-scroll-restore";

const createScrollRef = (
  scrollTop: number
): React.RefObject<HTMLDivElement | null> => {
  const div = document.createElement("div");
  div.scrollTop = scrollTop;
  return { current: div };
};

describe("hook: useScrollRestore", () => {
  it("selectedPath 変更時 → scrollTop = 0", () => {
    const scrollRef = createScrollRef(150);

    const { rerender } = renderHook(
      ({ selectedPath }) => useScrollRestore(scrollRef, selectedPath),
      { initialProps: { selectedPath: "a.md" } }
    );

    rerender({ selectedPath: "b.md" });
    expect(scrollRef.current?.scrollTop).toBe(0);
  });

  it("同一パスの再レンダリング → scrollTop が変更されない", () => {
    const scrollRef = createScrollRef(200);

    const { rerender } = renderHook(
      ({ selectedPath }) => useScrollRestore(scrollRef, selectedPath),
      { initialProps: { selectedPath: "a.md" } }
    );

    rerender({ selectedPath: "a.md" });
    expect(scrollRef.current?.scrollTop).toBe(200);
  });
});
