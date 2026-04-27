import type { ComponentPropsWithoutRef } from "react";

import { CopyButton } from "@/components/copy-button";

const MERMAID_CLASS_RE = /language-mermaid/;

export const MarkdownPre = ({
  children,
  ...props
}: ComponentPropsWithoutRef<"pre">) => {
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
    <div className="not-prose group rounded-md border border-border bg-code-bg">
      <div className="sticky top-0 z-10 h-0 pointer-events-none">
        <div className="relative pointer-events-auto">
          <CopyButton text={code} />
        </div>
      </div>
      <pre className="p-4 text-foreground overflow-x-auto" {...props}>
        {children}
      </pre>
    </div>
  );
};
