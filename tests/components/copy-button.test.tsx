// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

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
      expect(writeText).toHaveBeenCalledOnce();
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
