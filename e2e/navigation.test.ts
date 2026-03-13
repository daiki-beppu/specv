import { expect, test } from "@playwright/test";

test("内部 .md リンクでファイル遷移する", async ({ page }) => {
  await page.goto("/");

  // README.md をクリック
  await page.getByText("README.md").click();

  // 内部リンクをクリック
  const internalLink = page.locator('a[href="./docs/linked.md"]');
  await expect(internalLink).toBeVisible();
  await internalLink.click();

  // 遷移先のコンテンツが表示される
  await expect(
    page.getByRole("heading", { name: "Linked Document" })
  ).toBeVisible();
});

test("外部リンクが target=_blank を持つ", async ({ page }) => {
  await page.goto("/");

  // README.md をクリック
  await page.getByText("README.md").click();

  // 外部リンクの属性を確認
  const externalLink = page.getByRole("link", { name: "External Link" });
  await expect(externalLink).toBeVisible();
  await expect(externalLink).toHaveAttribute("target", "_blank");
  await expect(externalLink).toHaveAttribute("rel", /noopener/);
});
