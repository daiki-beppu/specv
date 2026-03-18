// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { ThemeToggle } from "@/components/theme-toggle";

const mockToggle = vi.fn();
let mockTheme: "light" | "dark";

vi.mock(import("@/hooks/use-theme"), () => ({
  useTheme: () => ({ theme: mockTheme, toggle: mockToggle }),
}));

describe("theme-toggle", () => {
  // eslint-disable-next-line jest/no-hooks -- jsdom cleanup required
  beforeEach(() => {
    mockTheme = "light";
  });

  // eslint-disable-next-line jest/no-hooks -- jsdom cleanup required
  afterEach(() => {
    cleanup();
    mockToggle.mockClear();
  });

  it("クリックするとテーマが切り替わる", () => {
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button"));
    expect(mockToggle).toHaveBeenCalledOnce();
  });

  it("ライトモードで「ダークモードに切り替える」旨の title が表示される", () => {
    mockTheme = "light";
    render(<ThemeToggle />);

    expect(screen.getByTitle("Switch to dark mode")).toBeDefined();
  });

  it("ダークモードで「ライトモードに切り替える」旨の title が表示される", () => {
    mockTheme = "dark";
    render(<ThemeToggle />);

    expect(screen.getByTitle("Switch to light mode")).toBeDefined();
  });
});
