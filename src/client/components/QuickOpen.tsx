import { useState, useEffect, useRef, useMemo } from "react";
import { File } from "lucide-react";
import { Fzf } from "fzf";
import type { FileNode } from "../../shared/types.js";

interface QuickOpenProps {
  files: FileNode[];
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
}

interface FlatFile {
  path: string;
  name: string;
  dir: string;
}

function flattenFiles(nodes: FileNode[]): FlatFile[] {
  const result: FlatFile[] = [];
  for (const node of nodes) {
    if (node.children) {
      result.push(...flattenFiles(node.children));
    } else {
      const lastSlash = node.path.lastIndexOf("/");
      result.push({
        path: node.path,
        name: node.name,
        dir: lastSlash > 0 ? node.path.slice(0, lastSlash) : "",
      });
    }
  }
  return result;
}

function HighlightChars({ str, indices }: { str: string; indices: Set<number> }) {
  return (
    <>
      {str.split("").map((char, i) =>
        indices.has(i) ? (
          <span key={i} className="text-foreground font-semibold">{char}</span>
        ) : (
          <span key={i}>{char}</span>
        ),
      )}
    </>
  );
}

export function QuickOpen({ files, open, onClose, onSelect }: QuickOpenProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allFiles = useMemo(() => flattenFiles(files), [files]);

  const fzf = useMemo(
    () => new Fzf(allFiles, { selector: (item) => item.path, limit: 30 }),
    [allFiles],
  );

  const results = useMemo(() => {
    if (!query) return allFiles.slice(0, 30).map((f) => ({ item: f, positions: new Set<number>() }));
    return fzf.find(query).map((entry) => ({
      item: entry.item,
      positions: entry.positions,
    }));
  }, [query, allFiles, fzf]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      onSelect(results[selectedIndex].item.path);
      onClose();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center pt-[12vh]" onClick={onClose}>
      <div
        className="w-[600px] h-fit max-h-[50vh] flex flex-col bg-popover border border-border rounded-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Go to File"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1 py-0.5 ml-2">ESC</kbd>
        </div>
        <div className="border-t border-border" />
        <div ref={listRef} className="overflow-y-auto py-1">
          {results.map(({ item: file, positions }, i) => (
            <button
              key={file.path}
              className={`w-full text-left px-3 py-1 text-sm flex items-center gap-2 ${
                i === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
              onClick={() => {
                onSelect(file.path);
                onClose();
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <File size={14} className="shrink-0 text-muted-foreground" />
              <span className="truncate text-muted-foreground">
                {query ? (
                  <HighlightChars str={file.name} indices={namePositions(file, positions)} />
                ) : (
                  file.name
                )}
              </span>
              {file.dir && (
                <span className="truncate text-xs text-muted-foreground ml-auto">{file.dir}</span>
              )}
            </button>
          ))}
          {results.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">No matching files</p>
          )}
        </div>
      </div>
    </div>
  );
}

function namePositions(file: FlatFile, positions: Set<number>): Set<number> {
  const nameStart = file.path.length - file.name.length;
  const result = new Set<number>();
  for (const pos of positions) {
    if (pos >= nameStart) {
      result.add(pos - nameStart);
    }
  }
  return result;
}
