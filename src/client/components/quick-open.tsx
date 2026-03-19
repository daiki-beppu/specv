import type { FileNode } from "@shared/types";
import { Fzf } from "fzf";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { FlatFile } from "@/components/search-result-item";
import { SearchResultItem } from "@/components/search-result-item";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";

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
        className="w-[calc(100vw-2rem)] max-w-[600px] h-fit max-h-[50vh] flex flex-col bg-popover border border-border rounded-md shadow-2xl overflow-hidden"
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
          <Separator />
          <CommandList>
            <CommandEmpty>No matching files</CommandEmpty>
            <CommandGroup>
              {results.map(({ item: file, positions }) => (
                <SearchResultItem
                  key={file.path}
                  file={file}
                  positions={positions}
                  query={query}
                  onSelect={handleSelect}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  );
};
