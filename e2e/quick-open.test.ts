import { expect, test } from "@playwright/test";

const modKey = process.platform === "darwin" ? "Meta" : "Control";

// React アプリがマウントされて useHotkey が登録されるまで待つ。
// サイドバー内のファイルが見えればアプリは初期データロード済み = hotkey 登録済み。
const waitForAppReady = async (page: import("@playwright/test").Page) => {
  await page.goto("/");
  const sidebar = page.locator('[data-slot="sidebar-inner"]');
  await expect(sidebar.getByText("README.md")).toBeVisible();
};

test.describe("quick-open", () => {
  test("Mod+P で Quick Open ダイアログが開く", async ({ page }) => {
    await waitForAppReady(page);

    await page.keyboard.press(`${modKey}+KeyP`);

    await expect(page.getByPlaceholder("Go to File")).toBeVisible();
  });

  test("クエリ入力で候補が fzf マッチ結果のみに絞られる", async ({ page }) => {
    await waitForAppReady(page);
    await page.keyboard.press(`${modKey}+KeyP`);
    const input = page.getByPlaceholder("Go to File");
    await expect(input).toBeVisible();

    await input.fill("linked");

    const items = page.locator('[data-slot="command-item"]');
    await expect(items).toHaveCount(1);
    await expect(items.filter({ hasText: "linked.md" })).toBeVisible();
    await expect(items.filter({ hasText: "endpoints.md" })).toHaveCount(0);
  });

  test("候補を Enter で選択するとダイアログが閉じプレビューが選択ファイルに切り替わる", async ({
    page,
  }) => {
    await waitForAppReady(page);
    await page.keyboard.press(`${modKey}+KeyP`);
    const input = page.getByPlaceholder("Go to File");
    await expect(input).toBeVisible();
    await input.fill("linked");
    // cmdk は raw input 構成では fill 後に自動 re-select しないため、
    // ArrowDown で絞り込み後の唯一候補にフォーカスを移してから確定する。
    await input.press("ArrowDown");
    await expect(
      page.locator('[data-slot="command-item"][data-selected="true"]', {
        hasText: "linked.md",
      })
    ).toBeVisible();

    await input.press("Enter");

    await expect(input).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Linked Document" })
    ).toBeVisible();
  });

  test("起動直後の空クエリで fixture 全 7 件が候補に並ぶ", async ({ page }) => {
    await waitForAppReady(page);

    await page.keyboard.press(`${modKey}+KeyP`);

    await expect(page.getByPlaceholder("Go to File")).toBeVisible();
    // hot-reload-clipboard.test.ts が並列ワーカーで走ると副 fixture
    // (hot-reload-new-file.md / hot-reload-delete-target.md) が transient に出現する。
    // 永続 fixture (hot-reload-target.md) は 7 件にカウントイン、副 fixture は除外する。
    // SearchResultItem は name span と dir span を別要素でレンダリングするため
    // CommandItem の textContent は "hot-reload-new-file.mddocs" のように連結される。
    // 末尾を anchor すると filter が機能しないため、prefix 一致のみで判定する。
    // 永続 fixture "hot-reload-target.md" は prefix が異なるため除外されない。
    await expect(
      page
        .locator('[data-slot="command-item"]')
        .filter({ hasNotText: /^hot-reload-(new-file|delete-target)\.md/ })
    ).toHaveCount(7);
  });

  test("該当しないクエリで No matching files が表示される", async ({
    page,
  }) => {
    await waitForAppReady(page);
    await page.keyboard.press(`${modKey}+KeyP`);
    const input = page.getByPlaceholder("Go to File");
    await expect(input).toBeVisible();

    await input.fill("xyzabc-not-exist");

    await expect(page.getByText("No matching files")).toBeVisible();
    await expect(page.locator('[data-slot="command-item"]')).toHaveCount(0);
  });

  test("ArrowDown で次の候補にフォーカスが移動する", async ({ page }) => {
    await waitForAppReady(page);
    await page.keyboard.press(`${modKey}+KeyP`);
    const input = page.getByPlaceholder("Go to File");
    await expect(input).toBeVisible();
    const items = page.locator('[data-slot="command-item"]');
    await expect(items.nth(0)).toHaveAttribute("data-selected", "true");

    await input.press("ArrowDown");

    await expect(items.nth(1)).toHaveAttribute("data-selected", "true");
    await expect(items.nth(0)).not.toHaveAttribute("data-selected", "true");
  });

  test("Esc でダイアログが閉じる", async ({ page }) => {
    await waitForAppReady(page);
    await page.keyboard.press(`${modKey}+KeyP`);
    const input = page.getByPlaceholder("Go to File");
    await expect(input).toBeVisible();

    await input.press("Escape");

    await expect(input).not.toBeVisible();
  });

  // Error 区分は外部依存を持たないため該当なし。明示記録として skip で固定する。
  test.skip("Quick Open は外部依存を持たないため Error 区分は該当なし", () => {
    // 該当するエラーケースなし
  });
});
