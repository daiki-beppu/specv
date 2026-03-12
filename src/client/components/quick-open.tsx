import type { FileNode } from "@shared/types.js";
import { Fzf } from "fzf";
import { FileText } from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";

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

const namePositions = (file: FlatFile, positions: Set<number>): Set<number> => {
  const nameStart = file.path.length - file.name.length;
  const result = new Set<number>();
  for (const pos of positions) {
    if (pos >= nameStart) {
      result.add(pos - nameStart);
    }
  }
  return result;
};

const flattenFiles = (nodes: FileNode[]): FlatFile[] => {
  const result: FlatFile[] = [];
  for (const node of nodes) {
    if (node.children) {
      result.push(...flattenFiles(node.children));
    } else {
      const lastSlash = node.path.lastIndexOf("/");
      result.push({
        dir: lastSlash > 0 ? node.path.slice(0, lastSlash) : "",
        name: node.name,
        path: node.path,
      });
    }
  }
  return result;
};

const groupCharsByHighlight = (str: string, indices: Set<number>) => {
  const spans: { highlighted: boolean; text: string }[] = [];
  for (let i = 0; i < str.length; i += 1) {
    const highlighted = indices.has(i);
    const prev = spans.at(-1);
    if (prev && prev.highlighted === highlighted) {
      prev.text += str[i];
    } else {
      spans.push({ highlighted, text: str[i] });
    }
  }
  return spans;
};

const HighlightChars = ({
  str,
  indices,
}: {
  str: string;
  indices: Set<number>;
}) => {
  const spans = groupCharsByHighlight(str, indices);

  return (
    <>
      {spans.map((span) =>
        span.highlighted ? (
          <span key={span.text} className="text-foreground font-semibold">
            {span.text}
          </span>
        ) : (
          <span key={span.text}>{span.text}</span>
        )
      )}
    </>
  );
};

const useQuickOpenEffects = (
  open: boolean,
  query: string,
  selectedIndex: number,
  setQuery: (q: string) => void,
  setSelectedIndex: (fn: number | ((i: number) => number)) => void,
  inputRef: React.RefObject<HTMLInputElement | null>,
  listRef: React.RefObject<HTMLDivElement | null>
) => {
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, setQuery, setSelectedIndex, inputRef]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, setSelectedIndex]);

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as
      | HTMLElement
      | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, listRef]);
};

const useQuickOpenSearch = (files: FileNode[], query: string) => {
  const allFiles = useMemo(() => flattenFiles(files), [files]);

  const fzf = useMemo(
    () => new Fzf(allFiles, { limit: 30, selector: (item) => item.path }),
    [allFiles]
  );

  return useMemo(() => {
    if (!query) {
      return allFiles
        .slice(0, 30)
        .map((f) => ({ item: f, positions: new Set<number>() }));
    }
    return fzf.find(query).map((entry) => ({
      item: entry.item,
      positions: entry.positions,
    }));
  }, [query, allFiles, fzf]);
};

const QuickOpenItem = ({
  file,
  positions,
  isSelected,
  query,
  onSelect,
  onClose,
  onMouseEnter,
}: {
  file: FlatFile;
  positions: Set<number>;
  isSelected: boolean;
  query: string;
  onSelect: (path: string) => void;
  onClose: () => void;
  onMouseEnter: () => void;
}) => {
  const handleClick = useCallback(() => {
    onSelect(file.path);
    onClose();
  }, [onSelect, onClose, file.path]);

  return (
    <button
      type="button"
      className={`w-full text-left px-3 py-1 text-sm flex items-center gap-2 ${
        isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
      }`}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
    >
      <FileText size={14} className="shrink-0 text-blue-500" />
      <span className="truncate text-muted-foreground">
        {query ? (
          <HighlightChars
            str={file.name}
            indices={namePositions(file, positions)}
          />
        ) : (
          file.name
        )}
      </span>
      {file.dir && (
        <span className="truncate text-xs text-muted-foreground ml-auto">
          {file.dir}
        </span>
      )}
    </button>
  );
};

const QuickOpenBackdrop = ({
  onClose,
  onKeyDown,
  children,
}: {
  onClose: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  children: React.ReactNode;
}) => (
  // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- backdrop overlay
  <div
    className="fixed inset-0 z-50 flex justify-center pt-[12vh]"
    onClick={onClose}
    onKeyDown={onKeyDown}
  >
    {children}
  </div>
);

const QuickOpenDialog = ({
  onClickCapture,
  onKeyDownCapture,
  children,
}: {
  onClickCapture: (e: React.MouseEvent) => void;
  onKeyDownCapture: (e: React.KeyboardEvent) => void;
  children: React.ReactNode;
}) => (
  // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- dialog container
  <div
    className="w-[600px] h-fit max-h-[50vh] flex flex-col bg-popover border border-border rounded-md shadow-2xl overflow-hidden"
    onClick={onClickCapture}
    onKeyDown={onKeyDownCapture}
  >
    {children}
  </div>
);

const useQuickOpenHandlers = (
  results: { item: FlatFile; positions: Set<number> }[],
  selectedIndex: number,
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>,
  setQuery: React.Dispatch<React.SetStateAction<string>>,
  onSelect: (path: string) => void,
  onClose: () => void
) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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
    },
    [results, selectedIndex, onSelect, onClose, setSelectedIndex]
  );

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    [setQuery]
  );

  const handleStopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleStopKeyPropagation = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
  }, []);

  const handleMouseEnters = useMemo(
    () => results.map((_, i) => () => setSelectedIndex(i)),
    [results, setSelectedIndex]
  );

  return {
    handleKeyDown,
    handleMouseEnters,
    handleQueryChange,
    handleStopKeyPropagation,
    handleStopPropagation,
  };
};

export const QuickOpen = ({
  files,
  open,
  onClose,
  onSelect,
}: QuickOpenProps) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const results = useQuickOpenSearch(files, query);

  useQuickOpenEffects(
    open,
    query,
    selectedIndex,
    setQuery,
    setSelectedIndex,
    inputRef,
    listRef
  );

  const handlers = useQuickOpenHandlers(
    results,
    selectedIndex,
    setSelectedIndex,
    setQuery,
    onSelect,
    onClose
  );

  if (!open) {
    return null;
  }

  return (
    <QuickOpenBackdrop onClose={onClose} onKeyDown={handlers.handleKeyDown}>
      <QuickOpenDialog
        onClickCapture={handlers.handleStopPropagation}
        onKeyDownCapture={handlers.handleStopKeyPropagation}
      >
        <div className="flex items-center px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handlers.handleQueryChange}
            onKeyDown={handlers.handleKeyDown}
            placeholder="Go to File"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5 ml-2">
            ESC
          </kbd>
        </div>
        <div className="border-t border-border" />
        <div ref={listRef} className="overflow-y-auto py-1">
          {results.map(({ item: file, positions }, i) => (
            <QuickOpenItem
              key={file.path}
              file={file}
              positions={positions}
              isSelected={i === selectedIndex}
              query={query}
              onSelect={onSelect}
              onClose={onClose}
              onMouseEnter={handlers.handleMouseEnters[i]}
            />
          ))}
          {results.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">
              No matching files
            </p>
          )}
        </div>
      </QuickOpenDialog>
    </QuickOpenBackdrop>
  );
};
