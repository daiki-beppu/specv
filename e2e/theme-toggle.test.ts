import { expect, test } from "@playwright/test";

test.describe("theme-toggle", () => {
  test("ライトモードでトグルをクリックすると <html> に dark クラスが付与され title と localStorage が dark を反映する", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    const toggle = page.getByRole("button", {
      name: /Switch to (dark|light) mode/,
    });
    await expect(toggle).toHaveAttribute("title", "Switch to dark mode");
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    await toggle.click();

    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(toggle).toHaveAttribute("title", "Switch to light mode");
    expect(await page.evaluate(() => localStorage.getItem("specv-theme"))).toBe(
      "dark"
    );
  });

  test("ダークモードでトグルをクリックすると <html> から dark クラスが除去され title と localStorage が light を反映する", async ({
    page,
    context,
  }) => {
    await context.addInitScript(() =>
      localStorage.setItem("specv-theme", "dark")
    );
    await page.goto("/");
    const toggle = page.getByRole("button", {
      name: /Switch to (dark|light) mode/,
    });
    await expect(toggle).toHaveAttribute("title", "Switch to light mode");
    await expect(page.locator("html")).toHaveClass(/dark/);

    await toggle.click();

    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(toggle).toHaveAttribute("title", "Switch to dark mode");
    expect(await page.evaluate(() => localStorage.getItem("specv-theme"))).toBe(
      "light"
    );
  });

  test("dark に切り替え後にページをリロードしても <html> の dark クラスと localStorage 値が保持される", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    const toggle = page.getByRole("button", {
      name: /Switch to (dark|light) mode/,
    });
    await toggle.click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.reload();

    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(
      page.getByRole("button", { name: /Switch to (dark|light) mode/ })
    ).toHaveAttribute("title", "Switch to light mode");
    expect(await page.evaluate(() => localStorage.getItem("specv-theme"))).toBe(
      "dark"
    );
  });

  test('localStorage に "dark" を事前セットすると初期描画から <html> に dark クラスが付与される', async ({
    page,
    context,
  }) => {
    await context.addInitScript(() =>
      localStorage.setItem("specv-theme", "dark")
    );

    await page.goto("/");

    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(
      page.getByRole("button", { name: /Switch to (dark|light) mode/ })
    ).toHaveAttribute("title", "Switch to light mode");
  });

  test('localStorage に "light" を事前セットすると初期描画は <html> に dark クラスが付かない', async ({
    page,
    context,
  }) => {
    await context.addInitScript(() =>
      localStorage.setItem("specv-theme", "light")
    );

    await page.goto("/");

    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(
      page.getByRole("button", { name: /Switch to (dark|light) mode/ })
    ).toHaveAttribute("title", "Switch to dark mode");
  });

  test("localStorage 空 + prefers-color-scheme: dark で初期描画から <html> に dark クラスが付与される", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });

    await page.goto("/");

    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(
      page.getByRole("button", { name: /Switch to (dark|light) mode/ })
    ).toHaveAttribute("title", "Switch to light mode");
  });

  test("3 cycle (light → dark → light → dark) でクラス・title・localStorage が常に整合する", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    const toggle = page.getByRole("button", {
      name: /Switch to (dark|light) mode/,
    });
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(toggle).toHaveAttribute("title", "Switch to dark mode");

    await toggle.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(toggle).toHaveAttribute("title", "Switch to light mode");
    expect(await page.evaluate(() => localStorage.getItem("specv-theme"))).toBe(
      "dark"
    );

    await toggle.click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(toggle).toHaveAttribute("title", "Switch to dark mode");
    expect(await page.evaluate(() => localStorage.getItem("specv-theme"))).toBe(
      "light"
    );

    await toggle.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(toggle).toHaveAttribute("title", "Switch to light mode");
    expect(await page.evaluate(() => localStorage.getItem("specv-theme"))).toBe(
      "dark"
    );
  });

  // Error 区分は外部依存を持たないため該当なし。明示記録として skip で固定する。
  test.skip("テーマトグルは外部依存を持たないため Error 区分は該当なし", () => {
    // 該当するエラーケースなし
  });
});
