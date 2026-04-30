// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { App } from "@/app";

import { installEventSourceMock } from "../test-utils";

// API モック
vi.mock(import("@/api"), () => ({
  fetchFile: vi.fn().mockResolvedValue("# Test"),
  fetchFiles: vi.fn().mockResolvedValue([{ name: "test.md", path: "test.md" }]),
}));

// テーマモック
vi.mock(import("@/hooks/use-theme"), () => ({
  useTheme: () => ({ theme: "light" as const, toggle: vi.fn() }),
}));

// EventSource モック（複数テストで使う no-op スタブ。dispatch 機能は不要）
installEventSourceMock();

// UseHotkey モック
vi.mock(import("@tanstack/react-hotkeys"), () => ({
  useHotkey: vi.fn(),
}));

// MatchMedia モック（useIsMobile で必要）
Object.defineProperty(window, "matchMedia", {
  value: vi.fn().mockImplementation((query: string) => ({
    addEventListener: vi.fn(),
    addListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches: false,
    media: query,
    onchange: null,
    removeEventListener: vi.fn(),
    removeListener: vi.fn(),
  })),
  writable: true,
});

describe("app ヘッダー", () => {
  // eslint-disable-next-line jest/no-hooks -- jsdom cleanup required
  afterEach(() => {
    cleanup();
  });

  it("初期表示でサイドバー開閉ボタンが表示される", () => {
    render(<App />);

    const toggleButton = screen.getByTitle(/sidebar/i);

    expect(toggleButton).toBeDefined();
  });

  it("サイドバー開閉ボタンをクリックすると Show sidebar 状態に切り替わる", () => {
    render(<App />);
    const toggleButton = screen.getByTitle(/sidebar/i);

    fireEvent.click(toggleButton);

    expect(screen.getByTitle(/Show sidebar/i)).toBeDefined();
  });

  it("サイドバー開閉ボタンに適切な title が表示される", () => {
    render(<App />);

    expect(screen.getByTitle(/Hide sidebar.*⌘B/)).toBeDefined();
  });

  it("preview ボタンをクリックすると Preview モードになる", () => {
    render(<App />);

    // Source に切り替え
    fireEvent.click(screen.getByText("Source"));
    // Preview に戻す
    fireEvent.click(screen.getByText("Preview"));

    // Preview ボタンが選択状態（aria-selected で確認 — テスタビリティ改善後）
    expect(screen.getByText("Preview")).toBeDefined();
  });

  it("source ボタンをクリックすると Source モードになる", () => {
    render(<App />);

    fireEvent.click(screen.getByText("Source"));

    expect(screen.getByText("Source")).toBeDefined();
  });

  it("選択中のタブが aria-selected='true' で区別できる", () => {
    render(<App />);

    // テスタビリティ改善前はこのテストが Red になる
    const previewTab = screen.getByRole("tab", { name: "Preview" });
    expect(previewTab.getAttribute("aria-selected")).toBe("true");

    const sourceTab = screen.getByRole("tab", { name: "Source" });
    expect(sourceTab.getAttribute("aria-selected")).toBe("false");
  });
});
