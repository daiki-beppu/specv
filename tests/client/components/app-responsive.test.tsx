// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { App } from "@/app";

import { installEventSourceMock } from "../../test-utils";

// API モック
vi.mock(import("@/api"), () => ({
  fetchFile: vi.fn().mockResolvedValue("# Test"),
  fetchFiles: vi.fn().mockResolvedValue([
    { name: "test.md", path: "test.md" },
    { name: "other.md", path: "other.md" },
  ]),
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

function setViewport(mobile: boolean) {
  const width = mobile ? 375 : 1024;
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
    writable: true,
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: mobile ? query.includes("max-width") : false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
    writable: true,
  });
}

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(App, () => {
  // eslint-disable-next-line jest/no-hooks -- jsdom cleanup required
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("モバイル時", () => {
    beforeEach(() => {
      setViewport(true);
    });

    it("サイドバーが初期状態で非表示", () => {
      render(<App />);
      // モバイルではサイドバーは Sheet（非表示状態）
      const sidebar = document.querySelector("[data-mobile='true']");
      expect(sidebar).toBeNull();
      // Show sidebar ボタンが表示される
      expect(screen.getByTitle(/Show sidebar/i)).toBeDefined();
    });

    it("サイドバーを開くとモバイルシートとして表示される", () => {
      render(<App />);
      const toggleButton = screen.getByTitle(/Show sidebar/i);
      fireEvent.click(toggleButton);

      // モバイル用 Sheet が開く
      const sidebar = document.querySelector("[data-mobile='true']");
      expect(sidebar).not.toBeNull();
    });

    it("ファイル選択でサイドバーが閉じる", async () => {
      // Arrange: ファイルツリーがロードされるまで待つ
      render(<App />);
      await waitFor(() => {
        expect(screen.getByText("test.md")).toBeDefined();
      });

      // Act: サイドバーを開く
      fireEvent.click(screen.getByTitle(/Show sidebar/i));

      // Assert: モバイル Sheet が開いている
      const sidebar = document.querySelector("[data-mobile='true']");
      expect(sidebar).not.toBeNull();

      // Act: ファイルを選択する
      const fileItem = screen.getByText("other.md");
      fireEvent.click(fileItem);

      // Assert: サイドバーが閉じる
      await waitFor(() => {
        expect(document.querySelector("[data-mobile='true']")).toBeNull();
      });
    });
  });

  describe("デスクトップ時", () => {
    beforeEach(() => {
      setViewport(false);
    });

    it("サイドバーが初期状態で表示される", () => {
      render(<App />);
      expect(screen.getByText("specv")).toBeDefined();
      expect(screen.getByTitle(/Hide sidebar/i)).toBeDefined();
    });

    it("リサイズレールが表示される", () => {
      render(<App />);
      // Shadcn SidebarRail は button[data-sidebar="rail"]
      const rail = document.querySelector("[data-sidebar='rail']");
      expect(rail).not.toBeNull();
    });
  });
});
