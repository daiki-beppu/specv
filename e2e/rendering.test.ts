import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const fixturesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures/docs"
);

const SHOWCASE_FILE = "rendering-showcase.md";
const INVALID_MERMAID_FILE = "rendering-invalid-mermaid.md";
const INVALID_MERMAID_PATH = path.join(fixturesDir, INVALID_MERMAID_FILE);
const INVALID_MERMAID_CONTENT =
  "# Invalid Mermaid\n\n```mermaid\ninvalid syntax\n```\n";

const selectShowcase = async (page: import("@playwright/test").Page) => {
  await page.goto("/");
  const sidebar = page.locator('[data-slot="sidebar-inner"]');
  await sidebar.getByText(SHOWCASE_FILE).click();
};

test.describe("rendering", () => {
  test.describe("KaTeX", () => {
    test("rendering-showcase.md の inline 数式が .katex inline 要素として描画される", async ({
      page,
    }) => {
      await selectShowcase(page);

      // KaTeX は block を <span class="katex-display"><span class="katex">…</span></span>
      // の入れ子で描画する。inline span と block 内側 span の双方が .katex にマッチして
      // strict mode 違反になるため、`.first()` で先頭 (inline) のみに固定する。
      const inlineKatex = page.locator(".katex:not(.katex-display)").first();

      await expect(inlineKatex).toBeVisible({ timeout: 5000 });
    });

    test("rendering-showcase.md の block 数式が .katex display 要素として描画される", async ({
      page,
    }) => {
      await selectShowcase(page);

      const blockKatex = page.locator(".katex-display");

      await expect(blockKatex).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Mermaid", () => {
    test("rendering-showcase.md 選択で Mermaid 図が svg[id^=mermaid-] として遅延描画される", async ({
      page,
    }) => {
      await selectShowcase(page);

      const mermaidSvg = page.locator("svg[id^=mermaid-]");

      await expect(mermaidSvg).toBeVisible({ timeout: 5000 });
    });

    test("テーマ切替で Mermaid SVG が再描画される (prevTheme 比較で mermaid.initialize 再呼び出し)", async ({
      page,
    }) => {
      await selectShowcase(page);
      const mermaidSvg = page.locator("svg[id^=mermaid-]");
      await expect(mermaidSvg).toBeVisible({ timeout: 5000 });
      const initialId = await mermaidSvg.getAttribute("id");

      await page
        .getByRole("button", { name: /Switch to (dark|light) mode/ })
        .click();

      // markdown/mermaid-block.tsx の renderCountRef は effect 再実行ごとに increment され
      // svg の id 末尾も変化するため、id 変化で再描画を検出する。
      await expect
        .poll(() => mermaidSvg.getAttribute("id"), { timeout: 5000 })
        .not.toBe(initialId);
      await expect(mermaidSvg).toBeVisible();
    });

    test.describe("不正な Mermaid シンタックス", () => {
      test.beforeEach(() => {
        // 透過 fixture を作成。前テスト失敗時の防御として既存ファイルを先に削除する。
        if (fs.existsSync(INVALID_MERMAID_PATH)) {
          fs.unlinkSync(INVALID_MERMAID_PATH);
        }
        fs.writeFileSync(INVALID_MERMAID_PATH, INVALID_MERMAID_CONTENT);
      });

      test.afterEach(() => {
        if (fs.existsSync(INVALID_MERMAID_PATH)) {
          fs.unlinkSync(INVALID_MERMAID_PATH);
        }
      });

      test("error fallback (<pre><code>) が表示され SVG が出現しない", async ({
        page,
      }) => {
        await page.goto("/");
        const sidebar = page.locator('[data-slot="sidebar-inner"]');
        await expect(sidebar.getByText(INVALID_MERMAID_FILE)).toBeVisible({
          timeout: 5000,
        });
        await sidebar.getByText(INVALID_MERMAID_FILE).click();

        const fallback = page
          .locator(".prose pre code")
          .filter({ hasText: "invalid syntax" });

        await expect(fallback).toBeVisible({ timeout: 5000 });
        // mermaid.render は失敗時にも error 表示用の orphan SVG を document.body に残す。
        // ここで検証したいのは Preview ツリー内に成功描画 SVG が現れないことなので、
        // .prose 配下のみに限定して count を確認する。
        await expect(page.locator(".prose svg[id^=mermaid-]")).toHaveCount(0);
      });
    });
  });

  test.describe("GitHub Alerts", () => {
    test("[!NOTE] blockquote が .markdown-alert-note callout として描画される", async ({
      page,
    }) => {
      await selectShowcase(page);

      const noteAlert = page.locator(".markdown-alert.markdown-alert-note");

      await expect(noteAlert).toBeVisible({ timeout: 5000 });
      await expect(noteAlert).toContainText("Note 本文");
    });

    test("[!WARNING] blockquote が .markdown-alert-warning callout として描画される", async ({
      page,
    }) => {
      await selectShowcase(page);

      const warningAlert = page.locator(
        ".markdown-alert.markdown-alert-warning"
      );

      await expect(warningAlert).toBeVisible({ timeout: 5000 });
      await expect(warningAlert).toContainText("Warning 本文");
    });
  });

  test.describe("details", () => {
    test("<summary> クリックで <details> が [open] 属性を持ち本文が visible になる", async ({
      page,
    }) => {
      await selectShowcase(page);
      const details = page.locator(".prose details");
      await expect(details).toBeVisible({ timeout: 5000 });
      await expect(details).toHaveJSProperty("open", false);

      await details.locator("summary").click();

      await expect(details).toHaveJSProperty("open", true);
      await expect(details.getByText("Hidden content")).toBeVisible();
    });

    test("<details> 展開状態でテーマ切替しても [open] 属性が維持される", async ({
      page,
    }) => {
      await selectShowcase(page);
      const details = page.locator(".prose details");
      await expect(details).toBeVisible({ timeout: 5000 });
      await details.locator("summary").click();
      await expect(details).toHaveJSProperty("open", true);

      await page
        .getByRole("button", { name: /Switch to (dark|light) mode/ })
        .click();

      await expect(details).toHaveJSProperty("open", true);
    });
  });

  test.describe("autolink headings", () => {
    test("## Section A 内の anchor クリックで URL hash が #section-a に更新される", async ({
      page,
    }) => {
      await selectShowcase(page);
      const anchor = page.locator("h2 a[href='#section-a']");
      await expect(anchor).toHaveCount(1);

      // rehypeAutolinkHeadings は content 未指定で空 anchor を prepend するため、
      // 視覚的サイズが 0 で Playwright の viewport ベース click が成立しない。
      // DOM の .click() を直接呼ぶことで viewport 制約を回避し、href 属性に基づく
      // hash 反映を検証する。
      await anchor.evaluate((el: HTMLAnchorElement) => {
        el.click();
      });

      await expect(page).toHaveURL(/#section-a$/);
    });
  });

  // rehypeKatex は throwOnError: false 既定で不正数式を raw 表示するのみ。
  // 検証コスト > 価値（回帰検出の実用価値が低く Unit/markdown-pipeline でカバー済み）のため
  // 記録のみ skip で固定する。
  test.skip("不正な KaTeX 数式は raw 表示 — 検証コスト > 価値のため記録のみ", () => {
    // 該当する skip 理由は上記コメント参照
  });
});
