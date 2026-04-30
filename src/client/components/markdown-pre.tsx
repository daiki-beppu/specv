import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { CopyButton } from "@/components/copy-button";

const MERMAID_CLASS_RE = /language-mermaid/;

interface CodeElementProps {
  className?: string;
  children?: ReactNode;
}

const isReactNode = (value: unknown): value is ReactNode => {
  if (value === null || value === undefined) {
    return true;
  }
  const t = typeof value;
  return (
    t === "string" ||
    t === "number" ||
    t === "boolean" ||
    t === "bigint" ||
    t === "object"
  );
};

const getCodeElementProps = (node: unknown): CodeElementProps | null => {
  if (!node || typeof node !== "object" || !("props" in node)) {
    return null;
  }
  const { props } = node;
  if (!props || typeof props !== "object") {
    return null;
  }
  const className =
    "className" in props && typeof props.className === "string"
      ? props.className
      : undefined;
  const childrenValue: unknown =
    "children" in props ? props.children : undefined;
  const children = isReactNode(childrenValue) ? childrenValue : undefined;
  return { children, className };
};

export const MarkdownPre = ({
  children,
  ...props
}: ComponentPropsWithoutRef<"pre">) => {
  const firstChild: unknown = Array.isArray(children) ? children[0] : children;
  const codeProps = getCodeElementProps(firstChild);

  const isMermaid = MERMAID_CLASS_RE.test(codeProps?.className ?? "");

  if (isMermaid) {
    return children;
  }

  const code = codeProps ? String(codeProps.children).replace(/\n$/, "") : "";

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
