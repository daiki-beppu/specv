// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { QuickOpen } from "@/components/quick-open";

// Jsdom に ResizeObserver がないのでモック
class ResizeObserverMock {
  // eslint-disable-next-line class-methods-use-this, no-empty-function
  disconnect() {}
  // eslint-disable-next-line class-methods-use-this, no-empty-function
  observe() {}
  // eslint-disable-next-line class-methods-use-this, no-empty-function
  unobserve() {}
}
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// eslint-disable-next-line no-empty-function
const noop = () => {};

const sampleFiles = [
  { name: "README.md", path: "README.md" },
  {
    children: [
      { name: "index.ts", path: "src/index.ts" },
      { name: "utils.ts", path: "src/utils.ts" },
    ],
    name: "src",
    path: "src",
  },
];

// Jsdom に scrollIntoView がないのでモック
// eslint-disable-next-line no-empty-function
Element.prototype.scrollIntoView = () => {};

// eslint-disable-next-line max-statements
describe("quick-open", () => {
  // eslint-disable-next-line jest/no-hooks -- jsdom cleanup required
  afterEach(() => {
    cleanup();
  });

  it("open=true でダイアログが表示される", () => {
    render(
      <QuickOpen files={sampleFiles} open onClose={noop} onSelect={noop} />
    );

    expect(screen.getByPlaceholderText("Go to File")).toBeDefined();
  });

  it("open=false で何も表示されない", () => {
    render(
      <QuickOpen
        files={sampleFiles}
        open={false}
        onClose={noop}
        onSelect={noop}
      />
    );

    expect(screen.queryByPlaceholderText("Go to File")).toBeNull();
  });

  it("テキスト入力でファイルリストがフィルタされる", () => {
    render(
      <QuickOpen files={sampleFiles} open onClose={noop} onSelect={noop} />
    );

    const input = screen.getByPlaceholderText("Go to File");
    fireEvent.change(input, { target: { value: "index" } });

    // Cmdk の CommandItem は div[cmdk-item] としてレンダリングされる
    const items = document.querySelectorAll("[cmdk-item]");
    const hasIndex = [...items].some((el) =>
      el.textContent?.includes("index.ts")
    );
    const hasReadme = [...items].some((el) =>
      el.textContent?.includes("README.md")
    );

    expect(hasIndex).toBeTruthy();
    expect(hasReadme).toBeFalsy();
  });

  it("ファジーマッチで候補が絞り込まれる", () => {
    render(
      <QuickOpen files={sampleFiles} open onClose={noop} onSelect={noop} />
    );

    const input = screen.getByPlaceholderText("Go to File");
    fireEvent.change(input, { target: { value: "rdm" } });

    const items = document.querySelectorAll("[cmdk-item]");
    const hasReadme = [...items].some((el) =>
      el.textContent?.includes("README.md")
    );

    expect(hasReadme).toBeTruthy();
  });

  it("マッチした文字がハイライト表示される", () => {
    render(
      <QuickOpen files={sampleFiles} open onClose={noop} onSelect={noop} />
    );

    const input = screen.getByPlaceholderText("Go to File");
    fireEvent.change(input, { target: { value: "rdm" } });

    // ハイライトされた文字は font-semibold クラスを持つ
    const highlighted = document.querySelectorAll(".font-semibold");
    expect(highlighted.length).toBeGreaterThan(0);
  });

  it("アイテムをクリックすると選択されダイアログが閉じる", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(
      <QuickOpen
        files={sampleFiles}
        open
        onClose={onClose}
        onSelect={onSelect}
      />
    );

    // Cmdk の CommandItem は div[cmdk-item] なのでテキストで探してクリック
    const items = document.querySelectorAll("[cmdk-item]");
    const readme = [...items].find((el) =>
      el.textContent?.includes("README.md")
    );
    // eslint-disable-next-line typescript-eslint/no-non-null-assertion -- テストデータで必ず存在する
    fireEvent.click(readme!);

    expect(onSelect).toHaveBeenCalledWith("README.md");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("eSC キーでダイアログが閉じる", () => {
    const onClose = vi.fn();

    render(
      <QuickOpen files={sampleFiles} open onClose={onClose} onSelect={noop} />
    );

    const input = screen.getByPlaceholderText("Go to File");
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // Jsdom では cmdk のキーボードナビゲーション + focus 管理が
  // 実ブラウザと異なるため E2E でカバー
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("↑↓キーで選択が移動する", () => {
    render(
      <QuickOpen files={sampleFiles} open onClose={noop} onSelect={noop} />
    );

    const input = screen.getByPlaceholderText("Go to File");

    // ↓キーで次のアイテムに移動
    fireEvent.keyDown(input, { key: "ArrowDown" });

    const items = document.querySelectorAll("[cmdk-item]");
    const selected = [...items].find(
      (item) => item.dataset.selected === "true"
    );
    expect(selected?.textContent).toContain("index.ts");
  });

  it("enter で選択アイテムが確定する", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(
      <QuickOpen
        files={sampleFiles}
        open
        onClose={onClose}
        onSelect={onSelect}
      />
    );

    const input = screen.getByPlaceholderText("Go to File");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSelect).toHaveBeenCalledWith("README.md");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("結果が0件のとき 'No matching files' が表示される", () => {
    render(
      <QuickOpen files={sampleFiles} open onClose={noop} onSelect={noop} />
    );

    const input = screen.getByPlaceholderText("Go to File");
    fireEvent.change(input, { target: { value: "zzzzz" } });

    expect(screen.getByText("No matching files")).toBeDefined();
  });
});
