import { expect, test } from "@playwright/test";

test.describe("スクロール封じ込め", () => {
  test("html 要素がビューポートスクロールを防止している", async ({ page }) => {
    await page.goto("/");
    await page.getByText("README.md").click();
    await expect(
      page.getByRole("heading", { name: "specv E2E テストドキュメント" })
    ).toBeVisible();

    // Html に overflow: hidden が設定されていること
    const htmlOverflow = await page.evaluate(
      () => getComputedStyle(document.documentElement).overflow
    );
    expect(htmlOverflow).toBe("hidden");
  });

  test("コンテンツエリア内のスクロールは正常に動作する", async ({ page }) => {
    await page.goto("/");
    await page.getByText("README.md").click();
    await expect(
      page.getByRole("heading", { name: "specv E2E テストドキュメント" })
    ).toBeVisible();

    // コンテンツエリアのスクロールコンテナを特定
    const scrollContainer = page.locator("main .overflow-y-auto");
    const scrollHeight = await scrollContainer.evaluate(
      (el) => el.scrollHeight
    );
    const clientHeight = await scrollContainer.evaluate(
      (el) => el.clientHeight
    );

    // コンテンツがスクロール可能であること
    expect(scrollHeight).toBeGreaterThan(clientHeight);

    // スクロール操作が正しくコンテンツエリア内で動作する
    await scrollContainer.evaluate((el) => el.scrollTo(0, 100));
    const scrollTop = await scrollContainer.evaluate((el) => el.scrollTop);
    expect(scrollTop).toBe(100);

    // ビューポートは動かない
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});
