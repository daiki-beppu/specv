import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const fixturesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures/docs"
);

const HOT_RELOAD_TARGET = "hot-reload-target.md";
const HOT_RELOAD_NEW_FILE = "hot-reload-new-file.md";
const HOT_RELOAD_DELETE_TARGET = "hot-reload-delete-target.md";

const HOT_RELOAD_TARGET_PATH = path.join(fixturesDir, HOT_RELOAD_TARGET);
const HOT_RELOAD_NEW_FILE_PATH = path.join(fixturesDir, HOT_RELOAD_NEW_FILE);
const HOT_RELOAD_DELETE_TARGET_PATH = path.join(
  fixturesDir,
  HOT_RELOAD_DELETE_TARGET
);

const INITIAL_CONTENT = "# Hot Reload Target\n\ninitial content\n";

// `getting-started.md` の JSON コードブロック本文。`markdown/markdown-pre.tsx:25` で末尾改行が除去されるため
// 期待値も末尾改行なしで定義する。
const EXPECTED_JSON = `{
  "name": "specv",
  "version": "0.2.0",
  "description": "Local Markdown preview"
}`;

test.describe("hot-reload", () => {
  test.beforeEach(() => {
    // 前テスト失敗時の防御として永続 fixture を初期内容に書き戻す。
    fs.writeFileSync(HOT_RELOAD_TARGET_PATH, INITIAL_CONTENT);
  });

  test.afterEach(() => {
    // 永続 fixture は unlink せず初期内容に書き戻す。
    fs.writeFileSync(HOT_RELOAD_TARGET_PATH, INITIAL_CONTENT);
    if (fs.existsSync(HOT_RELOAD_NEW_FILE_PATH)) {
      fs.unlinkSync(HOT_RELOAD_NEW_FILE_PATH);
    }
    if (fs.existsSync(HOT_RELOAD_DELETE_TARGET_PATH)) {
      fs.unlinkSync(HOT_RELOAD_DELETE_TARGET_PATH);
    }
  });

  test("選択中ファイルの内容が書き換えられると preview に新しい内容が反映される", async ({
    page,
  }) => {
    await page.goto("/");
    const sidebar = page.locator('[data-slot="sidebar-inner"]');
    await sidebar.getByText(HOT_RELOAD_TARGET).click();
    const preview = page.locator(".prose");
    await expect(preview).toContainText("initial content");

    fs.writeFileSync(
      HOT_RELOAD_TARGET_PATH,
      "# Hot Reload Target\n\nupdated content\n"
    );

    await expect(preview).toContainText("updated content");
  });

  test("ツリー外に新ファイルが追加されるとサイドバーに新ファイルが出現する", async ({
    page,
  }) => {
    await page.goto("/");
    const sidebar = page.locator('[data-slot="sidebar-inner"]');
    await expect(sidebar.getByText(HOT_RELOAD_TARGET)).toBeVisible();
    await expect(sidebar.getByText(HOT_RELOAD_NEW_FILE)).not.toBeVisible();

    fs.writeFileSync(HOT_RELOAD_NEW_FILE_PATH, "# New File\n");

    await expect(sidebar.getByText(HOT_RELOAD_NEW_FILE)).toBeVisible();
  });

  test("連続 3 書換えが debounce で集約され preview が最終内容に収束する", async ({
    page,
  }) => {
    await page.goto("/");
    const sidebar = page.locator('[data-slot="sidebar-inner"]');
    await sidebar.getByText(HOT_RELOAD_TARGET).click();
    const preview = page.locator(".prose");
    await expect(preview).toContainText("initial content");

    // 50ms 間隔で 3 書換え（書換え間隔の制御のためのみ waitForTimeout を使用）。
    // 200ms debounce 内に収まるため、最終 marker のみが SSE に流れる前提。
    fs.writeFileSync(
      HOT_RELOAD_TARGET_PATH,
      "# Hot Reload Target\n\nintermediate-1\n"
    );
    await page.waitForTimeout(50);
    fs.writeFileSync(
      HOT_RELOAD_TARGET_PATH,
      "# Hot Reload Target\n\nintermediate-2\n"
    );
    await page.waitForTimeout(50);
    fs.writeFileSync(
      HOT_RELOAD_TARGET_PATH,
      "# Hot Reload Target\n\nupdated final\n"
    );

    await expect(preview).toContainText("updated final");
    await expect(preview).not.toContainText("intermediate-1");
    await expect(preview).not.toContainText("intermediate-2");
  });

  test("選択中ファイル削除でサイドバーから消え preview が先頭ファイル（docs/api/endpoints.md）内容に切り替わる", async ({
    page,
  }) => {
    fs.writeFileSync(
      HOT_RELOAD_DELETE_TARGET_PATH,
      "# Delete Target\n\ndelete me\n"
    );
    // findFirstFile (depth-first + dirs-first sort) が指す先頭 fixture の内容を実ファイルから導出する。
    // fixture 改変時の連鎖崩壊を防ぐため、先頭行から `# ` プレフィックスを除去した文字列を期待値に使う。
    const firstFileContent = fs.readFileSync(
      path.join(fixturesDir, "api/endpoints.md"),
      "utf-8"
    );
    const expectedHeading = firstFileContent.trim().replace(/^#\s+/, "");

    await page.goto("/");
    const sidebar = page.locator('[data-slot="sidebar-inner"]');
    await expect(sidebar.getByText(HOT_RELOAD_DELETE_TARGET)).toBeVisible();
    await sidebar.getByText(HOT_RELOAD_DELETE_TARGET).click();
    const preview = page.locator(".prose");
    await expect(preview).toContainText("delete me");

    fs.unlinkSync(HOT_RELOAD_DELETE_TARGET_PATH);

    await expect(sidebar.getByText(HOT_RELOAD_DELETE_TARGET)).not.toBeVisible();
    await expect(preview).toContainText(expectedHeading);
  });
});

test.describe("clipboard", () => {
  test.beforeEach(async ({ context }) => {
    // `writeText` は user gesture (button click) で許可されるため、`clipboard-read` のみ付与する。
    await context.grantPermissions(["clipboard-read"]);
  });

  test("コードブロックの Copy ボタンクリックで clipboard にコード文字列が書き込まれ button title が Copied! に変化する", async ({
    page,
  }) => {
    await page.goto("/");
    const sidebar = page.locator('[data-slot="sidebar-inner"]');
    await sidebar.getByText("guide").click();
    await sidebar.getByText("getting-started.md").click();
    const codeBlock = page.locator("pre").first();
    await expect(codeBlock).toBeVisible();
    // CopyButton は `md:opacity-0 md:group-hover:opacity-100` のため hover で可視化する。
    await codeBlock.hover();
    const copyButton = page.locator('button[title="Copy"]').first();
    await expect(copyButton).toBeVisible();

    await copyButton.click();

    // `handleCopy` は `await writeText(text)` 完了後に `setCopied(true)` を呼ぶため、
    // title `Copied!` の DOM 反映 = writeText 完了の確証として先に待機してから readText を実行する。
    await expect(page.locator('button[title="Copied!"]').first()).toBeVisible();
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).toBe(EXPECTED_JSON);
  });

  test("クリック後 2000ms 経過で button title が Copy に戻る", async ({
    page,
  }) => {
    await page.goto("/");
    const sidebar = page.locator('[data-slot="sidebar-inner"]');
    await sidebar.getByText("guide").click();
    await sidebar.getByText("getting-started.md").click();
    const codeBlock = page.locator("pre").first();
    await expect(codeBlock).toBeVisible();
    await codeBlock.hover();
    const copyButton = page.locator('button[title="Copy"]').first();
    await expect(copyButton).toBeVisible();

    await copyButton.click();

    await expect(page.locator('button[title="Copied!"]').first()).toBeVisible();
    // `setTimeout(2000)` の実時間復帰検証。アイコン変化と区別し title 属性遷移を直接 assertion する。
    await expect(copyButton).toHaveAttribute("title", "Copy", {
      timeout: 3000,
    });
  });

  // Chromium ローカルでは `navigator.clipboard` 強制無効化のセットアップが煩雑であり、
  // fallback (`<textarea>` + `execCommand`) は Unit (#102 / tests/client/components/copy-button.test.tsx)
  // で検証済みのため、明示記録として skip で固定する。
  test.skip("clipboard API 不可環境の fallback は Unit (#102) で検証済みのため記録のみ", () => {
    // 該当するエラーケースなし
  });
});
