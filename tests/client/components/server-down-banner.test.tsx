// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import {
  RESTART_COMMAND,
  ServerDownBanner,
} from "@/components/server-down-banner";

const originalLocation = window.location;
let reloadMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  reloadMock = vi.fn();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { reload: reloadMock },
  });
});

afterEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
  cleanup();
});

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(ServerDownBanner, () => {
  it("status=disconnected のときアラートを表示する", () => {
    render(<ServerDownBanner status="disconnected" />);

    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("status=disconnected のときサーバー停止を伝える文言を表示する", () => {
    render(<ServerDownBanner status="disconnected" />);

    expect(screen.getByRole("alert").textContent).toMatch(/サーバー/);
  });

  it("status=disconnected のとき再起動コマンドの案内を表示する", () => {
    render(<ServerDownBanner status="disconnected" />);

    expect(screen.getByRole("alert").textContent).toContain(RESTART_COMMAND);
  });

  it("status=disconnected のときリロードボタンのクリックで location.reload を呼ぶ", () => {
    render(<ServerDownBanner status="disconnected" />);

    fireEvent.click(screen.getByRole("button"));

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("status=connected のときは何も表示しない", () => {
    render(<ServerDownBanner status="connected" />);

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("status=connecting のときは何も表示しない", () => {
    render(<ServerDownBanner status="connecting" />);

    expect(screen.queryByRole("alert")).toBeNull();
  });
});
