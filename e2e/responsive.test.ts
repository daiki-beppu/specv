import { expect, test } from "@playwright/test";

const MOBILE_VIEWPORT = { height: 667, width: 375 };
const DESKTOP_VIEWPORT = { height: 900, width: 1280 };

test.describe("モバイルビューポート", () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test("サイドバーが初期非表示", async ({ page }) => {
    await page.goto("/");
    // サイドバーのタイトルが見えない
    await expect(page.getByText("specv")).not.toBeVisible();
    // Show sidebar ボタンが見える
    await expect(page.getByTitle(/Show sidebar/i)).toBeVisible();
  });

  test("トグルでオーバーレイドロワー表示", async ({ page }) => {
    await page.goto("/");
    await page.getByTitle(/Show sidebar/i).click();

    // サイドバーが表示される
    await expect(page.getByText("specv")).toBeVisible();
    // バックドロップが表示される
    await expect(
      page.locator("[data-testid='sidebar-backdrop']")
    ).toBeVisible();
  });

  test("バックドロップクリックで閉じる", async ({ page }) => {
    await page.goto("/");
    await page.getByTitle(/Show sidebar/i).click();
    await expect(page.getByText("specv")).toBeVisible();

    // バックドロップをクリック
    await page.locator("[data-testid='sidebar-backdrop']").click();
    await expect(page.getByText("specv")).not.toBeVisible();
  });

  test("ファイル選択でサイドバーが閉じる", async ({ page }) => {
    await page.goto("/");
    await page.getByTitle(/Show sidebar/i).click();
    await expect(page.getByText("specv")).toBeVisible();

    // ファイルを選択
    await page.getByText("README.md").click();
    await expect(page.getByText("specv")).not.toBeVisible();
  });

  test("Quick Open がモバイル幅に収まる", async ({ page }) => {
    await page.goto("/");
    // ⌘P で Quick Open を開く
    await page.keyboard.press("Meta+p");
    const dialog = page.locator("[class*='max-w-']");
    await expect(dialog.first()).toBeVisible();

    // 幅がビューポートに収まっているか
    const box = await dialog.first().boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
  });
});

test.describe("デスクトップビューポート", () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test("サイドバーが初期表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("specv")).toBeVisible();
    await expect(page.getByTitle(/Hide sidebar/i)).toBeVisible();
  });

  test("リサイズセパレーターが表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("separator")).toBeVisible();
  });
});
