import { expect, test } from "@playwright/test";

test("初期表示時に一本道ディレクトリが自動展開される", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.locator('[data-slot="sidebar-inner"]');

  // docs はルートの唯一のディレクトリなので自動展開
  await expect(sidebar.getByText("docs").first()).toBeVisible();
  // docs 内のファイルが見えている = docs が展開済み
  await expect(sidebar.getByText("linked.md")).toBeVisible();
});

test("分岐点で展開が停止している", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.locator('[data-slot="sidebar-inner"]');

  // docs は展開されている（ルートの唯一のディレクトリ）
  await expect(sidebar.getByText("linked.md")).toBeVisible();

  // guide と api のサブディレクトリ名は見える（docs が展開済み）
  await expect(sidebar.getByText("guide")).toBeVisible();
  await expect(sidebar.getByRole("button", { name: "api" })).toBeVisible();

  // しかし guide 内のファイルは見えない（分岐で停止）
  await expect(sidebar.getByText("getting-started.md")).not.toBeVisible();
  // api 内のファイルも見えない
  await expect(sidebar.getByText("endpoints.md")).not.toBeVisible();

  // 深い階層（advanced/plugins/setup.md）も見えない
  await expect(sidebar.getByText("advanced")).not.toBeVisible();
  await expect(sidebar.getByText("setup.md")).not.toBeVisible();
});

test("クリック展開で深い一本道が自動展開される", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.locator('[data-slot="sidebar-inner"]');

  // guide をクリック → guide 内は一本道（advanced → plugins）なので全て自動展開
  await sidebar.getByText("guide").click();

  // getting-started.md が見える
  await expect(sidebar.getByText("getting-started.md")).toBeVisible();
  // advanced が展開されて plugins も展開、setup.md まで見える
  await expect(sidebar.getByText("advanced")).toBeVisible();
  await expect(sidebar.getByText("plugins")).toBeVisible();
  await expect(sidebar.getByText("setup.md")).toBeVisible();
});

test("折りたたみで子孫パスも全て閉じる", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.locator('[data-slot="sidebar-inner"]');

  // guide を展開
  await sidebar.getByText("guide").click();
  await expect(sidebar.getByText("setup.md")).toBeVisible();

  // guide を折りたたむ → 子孫も全て非表示
  await sidebar.getByText("guide").click();
  await expect(sidebar.getByText("getting-started.md")).not.toBeVisible();
  await expect(sidebar.getByText("advanced")).not.toBeVisible();
  await expect(sidebar.getByText("setup.md")).not.toBeVisible();

  // 再展開 → サブツリー自動展開が再適用される
  await sidebar.getByText("guide").click();
  await expect(sidebar.getByText("setup.md")).toBeVisible();
});

test(".md を含まないディレクトリはツリーに表示されない", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.locator('[data-slot="sidebar-inner"]');

  // assets/ は .css のみ → ツリーに出ない
  await expect(sidebar.getByText("assets")).not.toBeVisible();
  // empty-dir/ は空 → ツリーに出ない
  await expect(sidebar.getByText("empty-dir")).not.toBeVisible();
  // images/ は .png のみ → ツリーに出ない
  await expect(sidebar.getByText("images")).not.toBeVisible();
});

test("検索時の全展開が引き続き動作する", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.locator('[data-slot="sidebar-inner"]');

  // 深い階層のファイルを検索
  const searchInput = sidebar.getByPlaceholder("Search files...");
  await searchInput.fill("setup");

  // 深い階層のファイルが表示される
  await expect(sidebar.getByText("setup.md")).toBeVisible();

  // 検索をクリア → 元の展開状態に戻る
  await searchInput.fill("");
  await expect(sidebar.getByText("setup.md")).not.toBeVisible();
});
