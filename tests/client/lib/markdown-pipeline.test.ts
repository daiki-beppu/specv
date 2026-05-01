import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import { REHYPE_PLUGINS, REMARK_PLUGINS } from "@/lib/markdown-plugins";

const renderMarkdown = async (input: string): Promise<string> => {
  const file = await unified()
    .use(remarkParse)
    .use(REMARK_PLUGINS)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(REHYPE_PLUGINS)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(input);
  return String(file);
};

/* eslint-disable no-script-url -- XSS サニタイズの回帰テストに必要 */
describe("markdown pipeline", () => {
  describe("絵文字ショートコード (#6)", () => {
    it(":smile: が絵文字に変換される", async () => {
      const html = await renderMarkdown(":smile:");
      expect(html).toContain("😄");
    });
  });

  describe("hTML タグ描画 (#9)", () => {
    it("<kbd> がレンダリングされる", async () => {
      const html = await renderMarkdown("<kbd>Ctrl</kbd>");
      expect(html).toContain("<kbd>");
    });

    it("<details> と <summary> がレンダリングされる", async () => {
      const html = await renderMarkdown(
        "<details><summary>Title</summary>\n\nContent\n\n</details>"
      );
      expect(html).toContain("<details>");
      expect(html).toContain("<summary>");
    });

    it("<sub> がレンダリングされる", async () => {
      const html = await renderMarkdown("H<sub>2</sub>O");
      expect(html).toContain("<sub>");
    });

    it("<sup> がレンダリングされる", async () => {
      const html = await renderMarkdown("x<sup>2</sup>");
      expect(html).toContain("<sup>");
    });

    it("<br> がレンダリングされる", async () => {
      const html = await renderMarkdown("line1<br>line2");
      expect(html).toContain("<br>");
    });

    it("<abbr> がレンダリングされる", async () => {
      const html = await renderMarkdown("<abbr title='HyperText'>HTML</abbr>");
      expect(html).toContain("<abbr");
    });
  });

  describe("xSS サニタイズ (#9)", () => {
    it("<script> が除去される", async () => {
      const html = await renderMarkdown("<script>alert('xss')</script>");
      expect(html).not.toContain("<script>");
    });

    it("onerror 属性が除去される", async () => {
      const html = await renderMarkdown("<img src=x onerror=\"alert('xss')\">");
      expect(html).not.toContain("onerror");
    });

    it("javascript: URL が除去される", async () => {
      const html = await renderMarkdown(
        "<a href=\"javascript:alert('xss')\">click</a>"
      );
      expect(html).not.toContain("javascript:");
    });

    it("<iframe> が除去される", async () => {
      const html = await renderMarkdown(
        '<iframe src="https://evil.com"></iframe>'
      );
      expect(html).not.toContain("<iframe>");
    });

    it("<style> が除去される", async () => {
      const html = await renderMarkdown("<style>body{display:none}</style>");
      expect(html).not.toContain("<style>");
    });

    it("data:text/html が除去される", async () => {
      const html = await renderMarkdown(
        '<img src="data:text/html,<script>alert(1)</script>">'
      );
      expect(html).not.toContain("data:text/html");
    });
  });

  describe("gitHub Alerts", () => {
    it("[!NOTE] アラートがレンダリングされる", async () => {
      const html = await renderMarkdown("> [!NOTE]\n> これは補足情報です。");
      expect(html).toContain("markdown-alert");
      expect(html).toContain("markdown-alert-note");
    });

    it("[!WARNING] アラートがレンダリングされる", async () => {
      const html = await renderMarkdown(
        "> [!WARNING]\n> 注意が必要な情報です。"
      );
      expect(html).toContain("markdown-alert-warning");
    });

    it("アラートの SVG アイコンが保持される", async () => {
      const html = await renderMarkdown("> [!NOTE]\n> テスト");
      expect(html).toContain("<svg");
    });
  });

  describe("脚注 (#3)", () => {
    it("脚注が doc-endnotes セクションとしてレンダリングされる", async () => {
      const html = await renderMarkdown("テキスト[^1]\n\n[^1]: 脚注の内容");
      expect(html).toContain("<section");
      expect(html).toContain("data-footnotes");
    });
  });
});
/* eslint-enable no-script-url */
