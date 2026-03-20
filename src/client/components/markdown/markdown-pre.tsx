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
    <div className="group relative">
      <CopyButton text={code} />
      <pre {...props}>{children}</pre>
    </div>
  );
};
