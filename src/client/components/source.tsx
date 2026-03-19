import { Highlight } from "prism-react-renderer";

import { usePrismTheme } from "@/hooks/use-prism-theme";
import { cn } from "@/lib/utils";

interface SourceProps {
  content: string;
}

export const Source = ({ content }: SourceProps) => {
  const prismTheme = usePrismTheme();

  return (
    <Highlight theme={prismTheme} code={content} language="markdown">
      {({ className, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={cn(
            className,
            "p-4 rounded-lg overflow-x-auto text-sm border border-border bg-code-bg text-foreground"
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
  );
};
