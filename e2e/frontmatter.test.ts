import { expect, test } from "@playwright/test";

test("frontmatter 付きファイルのプレビューにテーブルが表示される", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByText("frontmatter.md").click();

  const table = page.locator("table").first();
  await expect(table).toBeVisible();
  await expect(table.locator("th", { hasText: "Key" })).toBeVisible();
  await expect(table.locator("th", { hasText: "Value" })).toBeVisible();
  await expect(table.locator("td", { hasText: "title" })).toBeVisible();
  await expect(
    table.locator("td", { hasText: "Frontmatter Test" })
  ).toBeVisible();
});
