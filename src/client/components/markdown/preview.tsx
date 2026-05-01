import "katex/dist/katex.min.css";
import "remark-github-blockquote-alert/alert.css";
import type { ComponentPropsWithoutRef } from "react";
import { useCallback } from "react";
import ReactMarkdown from "react-markdown";

import { CodeBlock } from "@/components/markdown/code-block";
import { MarkdownImage } from "@/components/markdown/markdown-image";
import { MarkdownLink } from "@/components/markdown/markdown-link";
import { MarkdownPre } from "@/components/markdown/markdown-pre";
import { MarkdownTable } from "@/components/markdown/markdown-table";
import { REHYPE_PLUGINS, REMARK_PLUGINS } from "@/lib/markdown-plugins";

interface PreviewProps {
  content: string;
  selectedPath: string | null;
  onNavigate: (path: string) => void;
}

export const Preview = ({
  content,
  selectedPath,
  onNavigate,
}: PreviewProps) => {
  const renderLink = useCallback(
    (props: ComponentPropsWithoutRef<"a">) => (
      <MarkdownLink
        {...props}
        selectedPath={selectedPath}
        onNavigate={onNavigate}
      />
    ),
    [selectedPath, onNavigate]
  );

  const renderImage = useCallback(
    (props: ComponentPropsWithoutRef<"img">) => (
      <MarkdownImage {...props} selectedPath={selectedPath} />
    ),
    [selectedPath]
  );

  return (
    <div className="prose dark:prose-invert max-w-[960px] mx-auto prose-pre:bg-code-bg prose-pre:border prose-pre:border-border prose-pre:rounded-md prose-pre:p-4 prose-pre:text-foreground prose-code:before:content-none prose-code:after:content-none prose-h1:border-b prose-h1:border-border prose-h1:pb-2 prose-h2:border-b prose-h2:border-border prose-h2:pb-2">
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        components={{
          a: renderLink,
          code: CodeBlock,
          img: renderImage,
          pre: MarkdownPre,
          table: MarkdownTable,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
