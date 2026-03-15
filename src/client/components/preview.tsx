import "katex/dist/katex.min.css";
import "remark-github-blockquote-alert/alert.css";
import { Check, Clipboard } from "lucide-react";
import { Highlight, themes } from "prism-react-renderer";
import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { lazy, Suspense, useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { remarkAlert } from "remark-github-blockquote-alert";
import remarkMath from "remark-math";

import { useTheme } from "@/hooks/use-theme";
import { resolveImageSrc, resolvePath } from "@/lib/path-utils";

const MermaidBlock = lazy(() => import("@/components/mermaid-block.js"));

const MERMAID_CLASS_RE = /language-mermaid/;
const REMARK_PLUGINS = [remarkAlert, remarkGfm, remarkMath];
const REHYPE_PLUGINS = [rehypeKatex, rehypeSlug, rehypeAutolinkHeadings];

interface PreviewProps {
  content: string;
  selectedPath: string | null;
  onNavigate: (path: string) => void;
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      title="Copy"
    >
      {copied ? <Check size={16} /> : <Clipboard size={16} />}
    </button>
  );
};

const MdLink = ({
  href,
  children,
  selectedPath,
  onNavigate,
  ...props
}: ComponentPropsWithoutRef<"a"> & {
  selectedPath: string | null;
  onNavigate: (path: string) => void;
}) => {
  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      if (selectedPath && href) {
        onNavigate(resolvePath(selectedPath, href));
      }
    },
    [selectedPath, href, onNavigate]
  );

  if (href?.endsWith(".md") && selectedPath) {
    return (
      <a {...props} href={href} onClick={handleClick}>
        {children}
      </a>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
};

export const Preview = ({
  content,
  selectedPath,
  onNavigate,
}: PreviewProps) => {
  const { theme } = useTheme();

  const renderLink = useCallback(
    (props: ComponentPropsWithoutRef<"a">) => (
      <MdLink {...props} selectedPath={selectedPath} onNavigate={onNavigate} />
    ),
    [selectedPath, onNavigate]
  );

  return (
    <div className="prose dark:prose-invert max-w-[960px] mx-auto prose-pre:bg-[#f6f8fa] dark:prose-pre:bg-[#161b22] prose-pre:p-4 prose-code:before:content-none prose-code:after:content-none prose-h1:border-b prose-h1:border-border prose-h1:pb-2 prose-h2:border-b prose-h2:border-border prose-h2:pb-2">
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        components={{
          a: renderLink,
          code({
            className,
            children,
            ...props
          }: ComponentPropsWithoutRef<"code">) {
            const match = /language-(\w+)/.exec(className || "");
            const code = String(children).replace(/\n$/, "");

            if (!match) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }

            if (match[1] === "mermaid") {
              return (
                <Suspense>
                  <MermaidBlock code={code} />
                </Suspense>
              );
            }

            const prismTheme = theme === "dark" ? themes.vsDark : themes.github;

            return (
              <Highlight theme={prismTheme} code={code} language={match[1]}>
                {({
                  className: hlClassName,
                  style,
                  tokens,
                  getLineProps,
                  getTokenProps,
                }) => (
                  <code
                    className={hlClassName}
                    style={{ ...style, background: "transparent" }}
                  >
                    {tokens.map((line, i) => (
                      <span
                        key={`line-${String(i)}`}
                        {...getLineProps({ line })}
                      >
                        {line.map((token, j) => (
                          <span
                            key={`token-${String(j)}`}
                            {...getTokenProps({ token })}
                          />
                        ))}
                        {"\n"}
                      </span>
                    ))}
                  </code>
                )}
              </Highlight>
            );
          },
          img({ src, alt, ...props }: ComponentPropsWithoutRef<"img">) {
            const resolvedSrc = src ? resolveImageSrc(src, selectedPath) : "";
            return <img src={resolvedSrc} alt={alt ?? ""} {...props} />;
          },
          pre({ children, ...props }: ComponentPropsWithoutRef<"pre">) {
            const codeEl = Array.isArray(children) ? children[0] : children;

            const isMermaid =
              codeEl &&
              typeof codeEl === "object" &&
              "props" in codeEl &&
              MERMAID_CLASS_RE.test(codeEl.props.className || "");

            if (isMermaid) {
              return children;
            }

            const code =
              codeEl && typeof codeEl === "object" && "props" in codeEl
                ? String(codeEl.props.children).replace(/\n$/, "")
                : "";

            return (
              <div className="group relative">
                <CopyButton text={code} />
                <pre {...props}>{children}</pre>
              </div>
            );
          },
          table({ children, ...props }: ComponentPropsWithoutRef<"table">) {
            return (
              <div className="overflow-x-auto">
                <table {...props}>{children}</table>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
