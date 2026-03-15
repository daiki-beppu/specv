import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import remarkEmoji from "remark-emoji";
import remarkGfm from "remark-gfm";
import { remarkAlert } from "remark-github-blockquote-alert";
import remarkMath from "remark-math";
import type { PluggableList } from "unified";

const SANITIZE_SCHEMA = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "abbr",
    "br",
    "details",
    "kbd",
    "sub",
    "summary",
    "sup",
  ],
};

export const REMARK_PLUGINS: PluggableList = [
  remarkAlert,
  remarkEmoji,
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
