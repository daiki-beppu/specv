import { expect, test } from "@playwright/test";

test("コードブロックにコピーボタンが表示される", async ({ page }) => {
  await page.goto("/");

  // README.md をクリック
  await page.getByText("README.md").click();

  // コードブロックが表示されるまで待機
  const codeBlock = page.locator("pre").first();
  await expect(codeBlock).toBeVisible();

  // ホバーしてコピーボタンを表示
  await codeBlock.hover();

  // コピーボタンが表示される
  const copyButton = page.locator('button[title="Copy"]').first();
  await expect(copyButton).toBeVisible();
});
