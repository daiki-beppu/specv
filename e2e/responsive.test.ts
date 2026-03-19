import { expect, test } from "@playwright/test";

const MOBILE_VIEWPORT = { height: 667, width: 375 };
const DESKTOP_VIEWPORT = { height: 900, width: 1280 };

test.describe("モバイルビューポート", () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test("サイドバーが初期非表示", async ({ page }) => {
    await page.goto("/");
    // モバイルではサイドバーヘッダーが見えない
    await expect(
      page.getByRole("heading", { name: "specv", exact: true })
    ).not.toBeVisible();
    // Show sidebar ボタンが見える
    await expect(page.getByTitle(/Show sidebar/i)).toBeVisible();
  });

  test("トグルでモバイルシート表示", async ({ page }) => {
    await page.goto("/");
    await page.getByTitle(/Show sidebar/i).click();

    // shadcn Sidebar のモバイルシートが表示される
    await expect(page.locator("[data-mobile='true']")).toBeVisible();
  });

  test("シート外クリックで閉じる", async ({ page }) => {
    await page.goto("/");
    await page.getByTitle(/Show sidebar/i).click();
    await expect(page.locator("[data-mobile='true']")).toBeVisible();

    // シートの外側（オーバーレイ）をクリックして閉じる
    // サイドバーは左側 w-3/4 を占有するため、右端をクリック
    const overlay = page.locator("[data-slot='sheet-overlay']");
    const box = await overlay.boundingBox();
    await page.mouse.click(box!.x + box!.width - 10, box!.y + box!.height / 2);
    await expect(page.locator("[data-mobile='true']")).not.toBeVisible();
  });

  test("ファイル選択でサイドバーが閉じる", async ({ page }) => {
    await page.goto("/");
    await page.getByTitle(/Show sidebar/i).click();
    await expect(page.locator("[data-mobile='true']")).toBeVisible();

    // ファイルを選択
    await page.getByText("README.md").first().click();
    await expect(page.locator("[data-mobile='true']")).not.toBeVisible();
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
    await expect(
      page.getByRole("heading", { name: "specv", exact: true })
    ).toBeVisible();
    await expect(page.getByTitle(/Hide sidebar/i)).toBeVisible();
  });

  test("リサイズレールが表示される", async ({ page }) => {
    await page.goto("/");
    // shadcn SidebarRail は button[data-sidebar="rail"]
    await expect(page.locator("[data-sidebar='rail']")).toBeVisible();
  });
});
