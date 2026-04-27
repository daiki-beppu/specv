import { Highlight } from "prism-react-renderer";

import { CopyButton } from "@/components/copy-button";
import { usePrismTheme } from "@/hooks/use-prism-theme";
import { cn } from "@/lib/utils";

interface SourceProps {
  content: string;
}

export const Source = ({ content }: SourceProps) => {
  const prismTheme = usePrismTheme();

  return (
    <div className="group rounded-lg border border-border bg-code-bg">
      <div className="sticky top-0 z-10 h-0 pointer-events-none">
        <div className="relative pointer-events-auto">
          <CopyButton text={content} />
        </div>
      </div>
      <Highlight theme={prismTheme} code={content} language="markdown">
        {({ className, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={cn(
              className,
              "p-4 overflow-x-auto text-sm text-foreground"
            )}
          >
            {tokens.map((line, i) => (
              <div key={`line-${String(i)}`} {...getLineProps({ line })}>
                <span className="inline-block w-8 text-right mr-4 text-muted-foreground select-none">
                  {i + 1}
                </span>
                {line.map((token, j) => (
                  <span
                    key={`token-${String(j)}`}
                    {...getTokenProps({ token })}
                  />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
};
