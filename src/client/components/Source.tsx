import { Highlight, themes } from "prism-react-renderer";
import { useTheme } from "../hooks/useTheme.js";

interface SourceProps {
  content: string;
}

export function Source({ content }: SourceProps) {
  const { theme } = useTheme();
  const prismTheme = theme === "dark" ? themes.vsDark : themes.github;

  return (
    <Highlight theme={prismTheme} code={content} language="markdown">
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={`${className} p-4 rounded-lg overflow-x-auto text-sm`}
          style={style}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              <span className="inline-block w-8 text-right mr-4 text-gray-400 select-none">
                {i + 1}
              </span>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}
