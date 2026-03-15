import mermaid from "mermaid";
import { useEffect, useId, useRef, useState } from "react";

import { useTheme } from "@/hooks/use-theme";

interface MermaidBlockProps {
  code: string;
}

let prevTheme: string | null = null;

const initializeIfNeeded = (theme: string) => {
  const mermaidTheme = theme === "dark" ? "dark" : "default";
  if (prevTheme !== mermaidTheme) {
    mermaid.initialize({ startOnLoad: false, theme: mermaidTheme });
    prevTheme = mermaidTheme;
  }
};

const useMermaidRender = (code: string, theme: string) => {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const reactId = useId();
  const renderCountRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    initializeIfNeeded(theme);

    renderCountRef.current += 1;
    const id = `mermaid-${reactId.replaceAll(":", "")}-${String(renderCountRef.current)}`;

    const renderDiagram = async () => {
      try {
        const result = await mermaid.render(id, code);
        if (!cancelled) {
          setError(false);
          setSvg(result.svg);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setSvg(null);
        }
      }
    };

    renderDiagram();

    return () => {
      cancelled = true;
      const orphan = document.querySelector(`#${id}`);
      orphan?.remove();
    };
  }, [code, reactId, theme]);

  return { error, svg };
};

const MermaidBlock = ({ code }: MermaidBlockProps) => {
  const { theme } = useTheme();
  const { error, svg } = useMermaidRender(code, theme);

  if (error) {
    return (
      <pre>
        <code>{code}</code>
      </pre>
    );
  }

  if (!svg) {
    return null;
  }

  // eslint-disable-next-line react/no-danger -- mermaid.render() produces sanitized SVG
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
};

export default MermaidBlock;
