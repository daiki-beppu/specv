import { expect, test } from "@playwright/test";

test("ローカル画像が表示される", async ({ page }) => {
  await page.goto("/");

  // README.md をクリック
  await page.getByText("README.md").click();

  // 画像が表示されるまで待機
  const img = page.locator('img[alt="Test Image"]');
  await expect(img).toBeVisible();

  // src が /api/image?path= を含むことを確認
  const src = await img.getAttribute("src");
  expect(src).toContain("/api/image?path=");
});
