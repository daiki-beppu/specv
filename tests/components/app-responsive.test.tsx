// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { App } from "@/app";

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

// EventSource モック
class EventSourceMock {
  // eslint-disable-next-line class-methods-use-this, no-empty-function
  addEventListener() {}
  // eslint-disable-next-line class-methods-use-this, no-empty-function
  close() {}
  // eslint-disable-next-line class-methods-use-this, no-empty-function
  removeEventListener() {}
}
global.EventSource = EventSourceMock as unknown as typeof EventSource;

// useHotkey モック
vi.mock(import("@tanstack/react-hotkeys"), () => ({
  useHotkey: vi.fn(),
}));

function setMobile(mobile: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    addEventListener: vi.fn(),
    matches: mobile,
    removeEventListener: vi.fn(),
  }) as typeof window.matchMedia;
}

describe("app レスポンシブ", () => {
  // eslint-disable-next-line jest/no-hooks -- jsdom cleanup required
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("モバイル時", () => {
    beforeEach(() => {
      setMobile(true);
    });

    it("サイドバーが初期状態で非表示", () => {
      render(<App />);
      // サイドバーの h1 "specv" が表示されない
      expect(screen.queryByText("specv")).toBeNull();
      // Show sidebar ボタンが表示される
      expect(screen.getByTitle(/Show sidebar/i)).toBeDefined();
    });

    it("サイドバーを開くとオーバーレイドロワーとして表示される", () => {
      render(<App />);
      const toggleButton = screen.getByTitle(/Show sidebar/i);
      fireEvent.click(toggleButton);

      // サイドバーが表示される
      expect(screen.getByText("specv")).toBeDefined();

      // バックドロップが存在する
      const backdrop = document.querySelector(
        "[data-testid='sidebar-backdrop']"
      );
      expect(backdrop).not.toBeNull();
    });

    it("バックドロップクリックでサイドバーが閉じる", () => {
      render(<App />);
      // サイドバーを開く
      fireEvent.click(screen.getByTitle(/Show sidebar/i));
      expect(screen.getByText("specv")).toBeDefined();

      // バックドロップをクリック
      const backdrop = document.querySelector(
        "[data-testid='sidebar-backdrop']"
      );
      fireEvent.click(backdrop!);

      // サイドバーが閉じる
      expect(screen.queryByText("specv")).toBeNull();
    });

    it("ファイル選択でサイドバーが閉じる", async () => {
      render(<App />);
      // ファイルツリーのロードを待つ
      await waitFor(() => {
        expect(screen.getByText("test.md")).toBeDefined();
      });
      // サイドバーを開く
      fireEvent.click(screen.getByTitle(/Show sidebar/i));
      expect(screen.getByText("specv")).toBeDefined();

      // ファイルを選択
      const fileItem = screen.getByText("other.md");
      fireEvent.click(fileItem);

      // サイドバーが閉じる
      expect(screen.queryByText("specv")).toBeNull();
    });

    it("リサイズセパレーターが非表示", () => {
      render(<App />);
      // サイドバーを開く
      fireEvent.click(screen.getByTitle(/Show sidebar/i));

      // separator が表示されない
      expect(screen.queryByRole("separator")).toBeNull();
    });
  });

  describe("デスクトップ時", () => {
    beforeEach(() => {
      setMobile(false);
    });

    it("サイドバーが初期状態で表示される", () => {
      render(<App />);
      expect(screen.getByText("specv")).toBeDefined();
      expect(screen.getByTitle(/Hide sidebar/i)).toBeDefined();
    });

    it("リサイズセパレーターが表示される", () => {
      render(<App />);
      expect(screen.getByRole("separator")).toBeDefined();
    });
  });
});
