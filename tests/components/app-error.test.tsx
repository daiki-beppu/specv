// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";

import { fetchFile, fetchFiles } from "@/api";
import { App } from "@/app";
import { logError } from "@/lib/logger";

// API モック（per-test に挙動を差し替えるため初期実装は空）
vi.mock(import("@/api"), () => ({
  fetchFile: vi.fn(),
  fetchFiles: vi.fn(),
}));

// logError を spy 可能にする
vi.mock(import("@/lib/logger"), () => ({
  logError: vi.fn(),
}));

// テーマモック
vi.mock(import("@/hooks/use-theme"), () => ({
  useTheme: () => ({ theme: "light" as const, toggle: vi.fn() }),
}));

// EventSource モック（useWatch / useLifecycle で使われる）
class EventSourceMock {
  // eslint-disable-next-line class-methods-use-this, no-empty-function
  addEventListener() {}
  // eslint-disable-next-line class-methods-use-this, no-empty-function
  close() {}
  // eslint-disable-next-line class-methods-use-this, no-empty-function
  removeEventListener() {}
}
global.EventSource = EventSourceMock as unknown as typeof EventSource;

// UseHotkey モック
vi.mock(import("@tanstack/react-hotkeys"), () => ({
  useHotkey: vi.fn(),
}));

// MatchMedia モック（useIsMobile で必要）
Object.defineProperty(window, "matchMedia", {
  configurable: true,
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

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(App, () => {
  // eslint-disable-next-line jest/no-hooks -- jsdom cleanup と mock リセットに必要
  beforeEach(() => {
    vi.mocked(fetchFile).mockReset();
    vi.mocked(fetchFiles).mockReset();
    vi.mocked(logError).mockReset();
  });

  // eslint-disable-next-line jest/no-hooks -- jsdom cleanup required
  afterEach(() => {
    cleanup();
  });

  describe("読み込み失敗時", () => {
    it("fetchFiles が reject したとき logError が呼ばれツリーは空のまま render が throw しない", async () => {
      // Arrange
      vi.mocked(fetchFiles).mockRejectedValueOnce(new Error("fail"));
      vi.mocked(fetchFile).mockResolvedValue("");

      // Act
      render(<App />);

      // Assert
      await waitFor(() => {
        expect(logError).toHaveBeenCalledWith(
          "Failed to load files:",
          expect.any(Error)
        );
      });
      // ファイルツリーは空のまま（fetchFiles が成功していないので test.md は描画されない）
      expect(screen.queryByText("test.md")).toBeNull();
    });

    it("fetchFile が reject したとき logError が呼ばれ render が throw しない", async () => {
      // Arrange
      vi.mocked(fetchFiles).mockResolvedValue([
        { name: "test.md", path: "test.md" },
      ]);
      vi.mocked(fetchFile).mockRejectedValueOnce(new Error("fail"));

      // Act
      render(<App />);

      // Assert
      await waitFor(() => {
        expect(logError).toHaveBeenCalledWith(
          "Failed to load file:",
          expect.any(Error)
        );
      });
    });
  });
});
