// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { CopyButton } from "@/components/copy-button";
import { Preview } from "@/components/preview";

vi.mock(import("@/hooks/use-theme"), () => ({
  useTheme: () => ({ theme: "light" as const, toggle: vi.fn() }),
}));

// eslint-disable-next-line no-empty-function
const noop = () => {};

const codeBlockMd = "```js\nconsole.log('hello');\n```";

describe("copyButton", () => {
  // eslint-disable-next-line jest/no-hooks -- jsdom cleanup required
  afterEach(() => {
    cleanup();
  });

  it("コードブロックを含む Markdown で title='Copy' のボタンが表示される", () => {
    render(
      <Preview content={codeBlockMd} selectedPath="test.md" onNavigate={noop} />
    );

    expect(screen.getByTitle("Copy")).toBeDefined();
  });

  it("コピーボタンをクリックすると navigator.clipboard.writeText が呼ばれる", async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(
      <Preview content={codeBlockMd} selectedPath="test.md" onNavigate={noop} />
    );

    fireEvent.click(screen.getByTitle("Copy"));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
    });
  });

  it("コピー後に title が一時的に 'Copied!' に変わる", async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(
      <Preview content={codeBlockMd} selectedPath="test.md" onNavigate={noop} />
    );

    fireEvent.click(screen.getByTitle("Copy"));

    await waitFor(() => {
      expect(screen.getByTitle("Copied!")).toBeDefined();
    });
  });
});

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(CopyButton, () => {
  // eslint-disable-next-line jest/no-hooks -- jsdom cleanup required
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("クリックで navigator.clipboard.writeText(text) が呼ばれる", async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CopyButton text="hello world" />);
    fireEvent.click(screen.getByTitle("Copy"));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("hello world");
    });
  });

  it("writeText 解決後に title が 'Copied!' になり Check アイコンが表示される", async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CopyButton text="hello" />);
    fireEvent.click(screen.getByTitle("Copy"));

    const button = await screen.findByTitle("Copied!");
    expect(button.querySelector(".lucide-check")).not.toBeNull();
  });

  it("fakeTimers で 2000ms 経過すると title が 'Copy' に戻り Clipboard アイコンに戻る", async () => {
    vi.useFakeTimers();
    try {
      const writeText = vi.fn().mockResolvedValue();
      Object.assign(navigator, { clipboard: { writeText } });

      render(<CopyButton text="hello" />);
      await act(async () => {
        fireEvent.click(screen.getByTitle("Copy"));
        // writeText の Promise を microtask で解決させる
        await Promise.resolve();
      });
      expect(screen.getByTitle("Copied!")).toBeDefined();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      const button = screen.getByTitle("Copy");
      expect(button.querySelector(".lucide-clipboard")).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("text prop が変わった後のクリックは新しい text で writeText が呼ばれる", async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.assign(navigator, { clipboard: { writeText } });

    const { rerender } = render(<CopyButton text="first" />);
    fireEvent.click(screen.getByTitle("Copy"));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("first");
    });

    rerender(<CopyButton text="second" />);
    fireEvent.click(screen.getByTitle("Copied!"));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("second");
    });
  });

  it("初期描画時は title='Copy' で Clipboard アイコンが表示される", () => {
    render(<CopyButton text="hello" />);

    const button = screen.getByTitle("Copy");
    expect(button.querySelector(".lucide-clipboard")).not.toBeNull();
  });

  it("writeText が reject したとき document.execCommand('copy') の fallback が呼ばれ copied=true に遷移する", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.assign(navigator, { clipboard: { writeText } });
    // jsdom 28 では document.execCommand が削除されているため挿入する
    const execCommandSpy = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execCommandSpy,
      writable: true,
    });

    try {
      render(<CopyButton text="hello" />);
      fireEvent.click(screen.getByTitle("Copy"));

      await waitFor(() => {
        expect(execCommandSpy).toHaveBeenCalledWith("copy");
      });
      expect(screen.getByTitle("Copied!")).toBeDefined();
    } finally {
      delete (document as Partial<Document>).execCommand;
    }
  });
});
