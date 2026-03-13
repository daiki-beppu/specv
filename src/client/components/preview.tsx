import { Check, Clipboard } from "lucide-react";
import { Highlight, themes } from "prism-react-renderer";
import type { ComponentPropsWithoutRef } from "react";
import { useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useTheme } from "@/hooks/use-theme.js";

interface PreviewProps {
  content: string;
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

export const Preview = ({ content }: PreviewProps) => {
  const { theme } = useTheme();

  return (
    <div className="prose dark:prose-invert max-w-[960px] mx-auto prose-pre:bg-[#f6f8fa] dark:prose-pre:bg-[#161b22] prose-pre:p-4 prose-code:before:content-none prose-code:after:content-none prose-h1:border-b prose-h1:border-border prose-h1:pb-2 prose-h2:border-b prose-h2:border-border prose-h2:pb-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
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
          pre({ children, ...props }: ComponentPropsWithoutRef<"pre">) {
            const codeEl = Array.isArray(children) ? children[0] : children;
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
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
