// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { ThemeProvider, useTheme } from "@/hooks/use-theme";

const STORAGE_KEY = "specv-theme";

interface MockStorage {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
}

// jsdom 28 の localStorage は null prototype のため Storage.prototype 経由の spy が効かない。
// vi.stubGlobal で丸ごと置き換えてテスト間の独立性を保つ。
function setupStorage(initial: Record<string, string> = {}): MockStorage {
  const store = new Map<string, string>(Object.entries(initial));
  const mockStorage: MockStorage = {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
  };
  vi.stubGlobal("localStorage", mockStorage);
  return mockStorage;
}

function setupMatchMedia(matches: boolean) {
  const mql = {
    addEventListener: () => {
      // useTheme は matchMedia change を購読しないため no-op
    },
    matches,
    removeEventListener: () => {
      // 同上
    },
  };
  window.matchMedia = vi
    .fn()
    .mockReturnValue(mql) as unknown as typeof window.matchMedia;
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.documentElement.classList.remove("dark");
});

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(ThemeProvider, () => {
  it('localStorage="dark" のとき初期 theme が "dark" になる', () => {
    setupStorage({ [STORAGE_KEY]: "dark" });
    setupMatchMedia(false);

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe("dark");
  });

  it('localStorage="light" のとき初期 theme が "light" になる', () => {
    setupStorage({ [STORAGE_KEY]: "light" });
    setupMatchMedia(true);

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe("light");
  });

  it("localStorage 空 + matchMedia 一致で初期 theme が dark になる", () => {
    setupStorage();
    setupMatchMedia(true);

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe("dark");
  });

  it("localStorage 空 + matchMedia 不一致で初期 theme が light になる", () => {
    setupStorage();
    setupMatchMedia(false);

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe("light");
  });

  it("toggle() で light → dark に遷移する", () => {
    setupStorage({ [STORAGE_KEY]: "light" });
    setupMatchMedia(false);

    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.toggle();
    });

    expect(result.current.theme).toBe("dark");
  });

  it("toggle() で dark → light に遷移する", () => {
    setupStorage({ [STORAGE_KEY]: "dark" });
    setupMatchMedia(true);

    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.toggle();
    });

    expect(result.current.theme).toBe("light");
  });

  it('theme="dark" のとき <html> に "dark" クラスが付与される', () => {
    setupStorage({ [STORAGE_KEY]: "dark" });
    setupMatchMedia(false);

    renderHook(() => useTheme(), { wrapper });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it('theme="light" のとき <html> から "dark" クラスが除去される', () => {
    document.documentElement.classList.add("dark");
    setupStorage({ [STORAGE_KEY]: "dark" });
    setupMatchMedia(false);

    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.toggle();
    });

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("theme 変更時 localStorage.setItem(specv-theme, theme) が呼ばれる", () => {
    const storage = setupStorage({ [STORAGE_KEY]: "light" });
    setupMatchMedia(false);

    const { result } = renderHook(() => useTheme(), { wrapper });
    storage.setItem.mockClear();
    act(() => {
      result.current.toggle();
    });

    expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEY, "dark");
  });

  it("localStorage に予期しない文字列があってもキャストしてそのまま使う", () => {
    setupStorage({ [STORAGE_KEY]: "garbage" });
    setupMatchMedia(false);

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe("garbage");
  });
});

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(useTheme, () => {
  it("Provider 外で呼ぶと Error を throw する", () => {
    vi.spyOn(console, "error").mockImplementation(() => {
      // React が ErrorBoundary 不在で出すログ抑止
    });

    expect(() => renderHook(() => useTheme())).toThrow(
      "useTheme must be used within ThemeProvider"
    );
  });
});
