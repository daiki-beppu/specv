// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";

import { Source } from "@/components/source";

vi.mock(import("@/hooks/use-theme"), () => ({
  useTheme: () => ({ theme: "light" as const, toggle: vi.fn() }),
}));

describe("Source", () => {
  afterEach(() => {
    cleanup();
  });

  it("コピーボタンが表示される", () => {
    render(<Source content="# Hello" />);

    expect(screen.getByTitle("Copy")).toBeDefined();
  });
});
