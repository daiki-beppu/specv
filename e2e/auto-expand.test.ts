import { expect, test } from "@playwright/test";

test.describe("auto-expand", () => {
  test("初期表示時に一本道ディレクトリが自動展開される", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator('[data-slot="sidebar-inner"]');

    // Docs はルートの唯一のディレクトリなので自動展開
    await expect(sidebar.getByText("docs").first()).toBeVisible();
    // Docs 内のファイルが見えている = docs が展開済み
    await expect(sidebar.getByText("linked.md")).toBeVisible();
  });

  test("分岐点で展開が停止している", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator('[data-slot="sidebar-inner"]');
    // Docs は展開されている（ルートの唯一のディレクトリ）
    await expect(sidebar.getByText("linked.md")).toBeVisible();

    // Guide と api のサブディレクトリ名は見える（docs が展開済み）
    await expect(sidebar.getByText("guide")).toBeVisible();
    await expect(sidebar.getByRole("button", { name: "api" })).toBeVisible();

    // しかし guide 内のファイルは見えない（分岐で停止）
    await expect(sidebar.getByText("getting-started.md")).not.toBeVisible();
    // Api 内のファイルも見えない
    await expect(sidebar.getByText("endpoints.md")).not.toBeVisible();

    // 深い階層（advanced/plugins/setup.md）も見えない
    await expect(sidebar.getByText("advanced")).not.toBeVisible();
    await expect(sidebar.getByText("setup.md")).not.toBeVisible();
  });

  test("クリック展開で深い一本道が自動展開される", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator('[data-slot="sidebar-inner"]');

    // Guide をクリック → guide 内は一本道（advanced → plugins）なので全て自動展開
    await sidebar.getByText("guide").click();

    // Getting-started.md が見える
    await expect(sidebar.getByText("getting-started.md")).toBeVisible();
    // Advanced が展開されて plugins も展開、setup.md まで見える
    await expect(sidebar.getByText("advanced")).toBeVisible();
    await expect(sidebar.getByText("plugins")).toBeVisible();
    await expect(sidebar.getByText("setup.md")).toBeVisible();
  });

  test("折りたたむと子孫が非表示になる", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator('[data-slot="sidebar-inner"]');
    // Guide を展開して setup.md まで表示されるのを待つ
    await sidebar.getByText("guide").click();
    await expect(sidebar.getByText("setup.md")).toBeVisible();

    // Guide を折りたたむ
    await sidebar.getByText("guide").click();

    // 子孫も全て非表示になる
    await expect(sidebar.getByText("getting-started.md")).not.toBeVisible();
    await expect(sidebar.getByText("advanced")).not.toBeVisible();
    await expect(sidebar.getByText("setup.md")).not.toBeVisible();
  });

  test("再展開時に自動展開が再適用される", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator('[data-slot="sidebar-inner"]');
    // Guide を展開して setup.md まで表示されるのを待つ
    await sidebar.getByText("guide").click();
    await expect(sidebar.getByText("setup.md")).toBeVisible();
    // Guide を折りたたんで子孫が非表示になるのを待つ
    await sidebar.getByText("guide").click();
    await expect(sidebar.getByText("setup.md")).not.toBeVisible();

    // Guide を再展開
    await sidebar.getByText("guide").click();

    // サブツリー自動展開が再適用される
    await expect(sidebar.getByText("setup.md")).toBeVisible();
  });

  test(".md を含まないディレクトリはツリーに表示されない", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator('[data-slot="sidebar-inner"]');

    // Assets/ は .css のみ → ツリーに出ない
    await expect(sidebar.getByText("assets")).not.toBeVisible();
    // Empty-dir/ は空 → ツリーに出ない
    await expect(sidebar.getByText("empty-dir")).not.toBeVisible();
    // Images/ は .png のみ → ツリーに出ない
    await expect(sidebar.getByText("images")).not.toBeVisible();
  });

  test("検索フィルタで深い階層が表示される", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator('[data-slot="sidebar-inner"]');
    const searchInput = sidebar.getByPlaceholder("Search files...");

    // 深い階層のファイルを検索
    await searchInput.fill("setup");

    // 深い階層のファイルが表示される
    await expect(sidebar.getByText("setup.md")).toBeVisible();
  });

  test("検索クリアで元の展開状態に戻る", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator('[data-slot="sidebar-inner"]');
    const searchInput = sidebar.getByPlaceholder("Search files...");
    // 深い階層のファイルを検索して可視化されるのを待つ
    await searchInput.fill("setup");
    await expect(sidebar.getByText("setup.md")).toBeVisible();

    // 検索をクリア
    await searchInput.fill("");

    // 元の展開状態に戻り、深い階層は非表示
    await expect(sidebar.getByText("setup.md")).not.toBeVisible();
  });
});
