import { Highlight } from "prism-react-renderer";
import type { ComponentPropsWithoutRef } from "react";
import { Suspense, lazy } from "react";

import { usePrismTheme } from "@/hooks/use-prism-theme";
import { reactNodeToString } from "@/lib/react-node-to-string";

const MermaidBlock = lazy(() => import("@/components/markdown/mermaid-block"));

export const CodeBlock = ({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"code">) => {
  const prismTheme = usePrismTheme();
  const match = /language-(\w+)/.exec(className ?? "");
  const code = reactNodeToString(children).replace(/\n$/, "");

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
            <span key={`line-${String(i)}`} {...getLineProps({ line })}>
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
};
