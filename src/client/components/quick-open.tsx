import type { FileNode } from "@shared/types";
import { Fzf } from "fzf";
import { FileText } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";

// eslint-disable-next-line no-empty-function
const noop = () => {};

const handleDialogClick = (e: React.MouseEvent) => {
  e.stopPropagation();
};

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
      {spans.map((span, i) =>
        span.highlighted ? (
          <span key={i} className="text-foreground font-semibold">
            {span.text}
          </span>
        ) : (
          <span key={i}>{span.text}</span>
        )
      )}
    </>
  );
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

export const QuickOpen = ({
  files,
  open,
  onClose,
  onSelect,
}: QuickOpenProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useQuickOpenSearch(files, query);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const handleSelect = useCallback(
    (path: string) => {
      onSelect(path);
      onClose();
    },
    [onSelect, onClose]
  );

  const handleCommandKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    []
  );

  if (!open) {
    return null;
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- backdrop overlay
    <div
      className="fixed inset-0 z-50 flex justify-center pt-[12vh]"
      onClick={onClose}
      onKeyDown={noop}
    >
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- dialog container */}
      <div
        className="w-[600px] h-fit max-h-[50vh] flex flex-col bg-popover border border-border rounded-md shadow-2xl overflow-hidden"
        onClick={handleDialogClick}
        onKeyDown={noop}
      >
        <Command shouldFilter={false} onKeyDown={handleCommandKeyDown}>
          <div className="flex items-center px-3 py-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="Go to File"
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
            />
            <Kbd className="ml-2">ESC</Kbd>
          </div>
          <div className="border-t border-border" />
          <CommandList>
            <CommandEmpty>No matching files</CommandEmpty>
            <CommandGroup>
              {results.map(({ item: file, positions }) => (
                <CommandItem
                  key={file.path}
                  value={file.path}
                  onSelect={handleSelect}
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
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  );
};
