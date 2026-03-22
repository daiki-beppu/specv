// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { ThemeProvider, useTheme } from "@/hooks/use-theme";

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

const createMockStorage = (): Storage => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
};

describe("useTheme", () => {
  // eslint-disable-next-line jest/no-hooks -- jsdom setup/cleanup required
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMockStorage());
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
    document.documentElement.classList.remove("dark");
  });

  // eslint-disable-next-line jest/no-hooks -- jsdom cleanup required
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("localStorage に値がある → その値で初期化", () => {
    localStorage.setItem("specv-theme", "dark");

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe("dark");
  });

  it("localStorage に値がない + dark mode → 'dark' で初期化", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe("dark");
  });

  it("toggle() → theme が切り替わる", () => {
    localStorage.setItem("specv-theme", "light");

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe("light");

    act(() => {
      result.current.toggle();
    });

    expect(result.current.theme).toBe("dark");
  });

  it("theme 変更 → document.documentElement に dark クラス付与/除去", () => {
    localStorage.setItem("specv-theme", "light");

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(document.documentElement.classList.contains("dark")).toBe(false);

    act(() => {
      result.current.toggle();
    });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("ThemeProvider 外で useTheme() → Error", () => {
    expect(() => {
      renderHook(() => useTheme());
    }).toThrow("useTheme must be used within ThemeProvider");
  });
});
