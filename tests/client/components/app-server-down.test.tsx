// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";

import { fetchFile, fetchFiles } from "@/api";
import { App } from "@/app";

import { EventSourceMock } from "../../test-utils";

// API モック（per-test に挙動を差し替える）
vi.mock(import("@/api"), () => ({
  fetchFile: vi.fn(),
  fetchFiles: vi.fn(),
}));

vi.mock(import("@/lib/logger"), () => ({
  logError: vi.fn(),
}));

vi.mock(import("@/hooks/use-theme"), () => ({
  useTheme: () => ({ theme: "light" as const, toggle: vi.fn() }),
}));

vi.mock(import("@tanstack/react-hotkeys"), () => ({
  useHotkey: vi.fn(),
}));

// waitFor のコールバック内で条件分岐を使わずに型を絞り込むためのヘルパー。
const requireLifecycle = (): EventSourceMock => {
  const found = EventSourceMock.find("/api/lifecycle");
  if (!found) {
    throw new Error("lifecycle EventSource not created");
  }
  return found;
};

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

beforeEach(() => {
  EventSourceMock.reset();
  vi.stubGlobal("EventSource", EventSourceMock);
  vi.mocked(fetchFile).mockResolvedValue("");
  vi.mocked(fetchFiles).mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(App, () => {
  it("初期表示ではサーバー停止バナーを表示しない", async () => {
    render(<App />);

    await waitFor(() => {
      expect(fetchFiles).toHaveBeenCalled();
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("/api/lifecycle が error を発火するとサーバー停止バナーを表示する", async () => {
    render(<App />);

    const lifecycle = await waitFor(() => requireLifecycle());
    act(() => {
      lifecycle.dispatch("error");
    });

    expect(await screen.findByRole("alert")).toBeTruthy();
  });

  it("/api/lifecycle が open する（error 不発火）とバナーを表示しない", async () => {
    // --no-auto-close でも SSE 端点は常時登録されるため、EventSource は
    // text/event-stream を受けて open し error を発火しない。誤バナーを防ぐ回帰。
    render(<App />);

    const lifecycle = await waitFor(() => requireLifecycle());
    act(() => {
      lifecycle.dispatch("open");
    });

    await waitFor(() => {
      expect(fetchFiles).toHaveBeenCalled();
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("初回ファイル取得がネットワークエラーで失敗するとサーバー停止バナーを表示する", async () => {
    vi.mocked(fetchFiles).mockRejectedValueOnce(
      new TypeError("Failed to fetch")
    );

    render(<App />);

    expect(await screen.findByRole("alert")).toBeTruthy();
  });
});
