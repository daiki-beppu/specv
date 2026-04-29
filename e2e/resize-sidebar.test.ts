import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const getBox = async (locator: ReturnType<Page["locator"]>) => {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error("Element not found");
  }
  return box;
};

const dragHandle = async (
  page: Page,
  handle: ReturnType<Page["getByRole"]>,
  targetX: number
) => {
  const box = await getBox(handle);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetX, box.y + box.height / 2);
  await page.mouse.up();
};

const getSidebarWidth = async (page: Page) => {
  const box = await getBox(page.locator('[data-slot="sidebar-container"]'));
  return box.width;
};

test("サイドバーの幅をドラッグで変更できる", async ({ page }) => {
  await page.goto("/");
  const handle = page.getByRole("separator");

  const initialWidth = await getSidebarWidth(page);
  expect(initialWidth).toBe(256);

  const handleBox = await getBox(handle);
  await dragHandle(page, handle, handleBox.x + 100);

  const newWidth = await getSidebarWidth(page);
  expect(newWidth).toBeGreaterThan(initialWidth);
});

test("サイドバーの幅が最小幅・最大幅でクランプされる", async ({ page }) => {
  await page.goto("/");
  const handle = page.getByRole("separator");

  // 極端に左 → 最小幅（160px）
  await dragHandle(page, handle, 0);
  expect(await getSidebarWidth(page)).toBe(160);

  // 極端に右 → 最大幅（480px）
  await dragHandle(page, handle, 1000);
  expect(await getSidebarWidth(page)).toBe(480);
});

test("リサイズハンドルをダブルクリックでデフォルト幅にリセットされる", async ({
  page,
}) => {
  await page.goto("/");
  const handle = page.getByRole("separator");

  // ドラッグで幅を変更
  const handleBox = await getBox(handle);
  await dragHandle(page, handle, handleBox.x + 100);

  // ダブルクリックでリセット
  await handle.dblclick();
  await expect.poll(() => getSidebarWidth(page), { timeout: 5000 }).toBe(256);
});
