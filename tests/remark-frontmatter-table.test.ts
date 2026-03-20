import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import { remarkFrontmatterTable } from "@/lib/remark-frontmatter-table";

const renderMarkdown = async (input: string): Promise<string> => {
  const file = await unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkFrontmatterTable)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(input);
  return String(file);
};

describe(remarkFrontmatterTable, () => {
  it("frontmatter がテーブルとして出力される", async () => {
    const html = await renderMarkdown("---\ntitle: Hello\n---\n");
    expect(html).toContain("<table>");
  });

  it("テーブルに Key と Value のヘッダーが含まれる", async () => {
    const html = await renderMarkdown("---\ntitle: Hello\n---\n");
    expect(html).toContain("<th>Key</th>");
    expect(html).toContain("<th>Value</th>");
  });

  it("複数キーが全てテーブルに表示される", async () => {
    const html = await renderMarkdown(
      "---\ntitle: Hello\ndate: 2024-01-01\n---\n"
    );
    expect(html).toContain("<td>title</td>");
    expect(html).toContain("<td>Hello</td>");
    expect(html).toContain("<td>date</td>");
    expect(html).toContain("<td>2024-01-01</td>");
  });

  it("配列値がカンマ区切りで表示される", async () => {
    const html = await renderMarkdown("---\ntags: [test, markdown]\n---\n");
    expect(html).toContain("<td>test, markdown</td>");
  });

  it("オブジェクト値が JSON 文字列化で表示される", async () => {
    const html = await renderMarkdown("---\nmeta:\n  key: value\n---\n");
    expect(html).toContain("<td>{");
    expect(html).toContain("key");
  });

  it("null 値が空文字列で表示される", async () => {
    const html = await renderMarkdown("---\ndraft:\n---\n");
    expect(html).toContain("<td>draft</td>");
    expect(html).toContain("<td></td>");
  });

  it("frontmatter なしの場合テーブルが出力されない", async () => {
    const html = await renderMarkdown("# Hello\n\nWorld");
    expect(html).not.toContain("<table>");
  });

  it("空の frontmatter ではテーブルを生成しない", async () => {
    const html = await renderMarkdown("---\n---\n");
    expect(html).not.toContain("<table>");
  });

  it("不正な YAML ではテーブルを出さない", async () => {
    const html = await renderMarkdown("---\n: invalid: yaml: [[\n---\n");
    expect(html).not.toContain("<table>");
  });
});
