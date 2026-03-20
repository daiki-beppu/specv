import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import remarkEmoji from "remark-emoji";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { remarkAlert } from "remark-github-blockquote-alert";
import remarkMath from "remark-math";
import type { PluggableList } from "unified";

import { remarkFrontmatterTable } from "@/components/markdown/remark-frontmatter-table";

const SANITIZE_SCHEMA = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    div: [
      ...(defaultSchema.attributes?.div ?? []),
      "className",
      "dataType",
      "dir",
    ],
    p: [...(defaultSchema.attributes?.p ?? []), "className", "dir"],
    path: ["d", "fill"],
    svg: [
      "ariaHidden",
      "className",
      "fill",
      "height",
      "viewBox",
      "width",
      "xmlns",
    ],
  },
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "abbr",
    "br",
    "details",
    "kbd",
    "path",
    "sub",
    "summary",
    "sup",
    "svg",
  ],
};

export const REMARK_PLUGINS: PluggableList = [
  remarkAlert,
  remarkEmoji,
  remarkFrontmatter,
  remarkFrontmatterTable,
  remarkGfm,
  remarkMath,
];

export const REHYPE_PLUGINS: PluggableList = [
  rehypeRaw,
  [rehypeSanitize, SANITIZE_SCHEMA],
  rehypeKatex,
  rehypeSlug,
  rehypeAutolinkHeadings,
];
