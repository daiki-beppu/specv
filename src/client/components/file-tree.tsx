import type { FileNode } from "@shared/types";
import {
  Search,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
} from "lucide-react";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";

import { computeAutoExpandPaths, findNode } from "@/utils/auto-expand";

interface FileTreeProps {
  files: FileNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

const filterTree = (nodes: FileNode[], query: string): FileNode[] => {
  const lower = query.toLowerCase();
  const result: FileNode[] = [];
  for (const node of nodes) {
    if (node.children) {
      const filtered = filterTree(node.children, query);
      if (filtered.length > 0) {
        result.push({ ...node, children: filtered });
      }
    } else if (
      node.name.toLowerCase().includes(lower) ||
      node.path.toLowerCase().includes(lower)
    ) {
      result.push(node);
    }
  }
  return result;
};

const TreeNode = ({
  node,
  selectedPath,
  onSelect,
  forceExpand,
  expandedPaths,
  onExpand,
  onCollapse,
}: {
  node: FileNode;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  forceExpand: boolean;
  expandedPaths: Set<string>;
  onExpand: (dirPath: string) => void;
  onCollapse: (dirPath: string) => void;
}) => {
  const isDir = !!node.children;
  const isSelected = node.path === selectedPath;
  const isOpen = forceExpand || expandedPaths.has(node.path);

  const handleToggleExpand = useCallback(() => {
    if (isOpen && !forceExpand) {
      onCollapse(node.path);
    } else {
      onExpand(node.path);
    }
  }, [isOpen, forceExpand, onCollapse, onExpand, node.path]);

  const handleSelect = useCallback(() => {
    onSelect(node.path);
  }, [onSelect, node.path]);

  if (isDir) {
    return (
      <li>
        <button
          type="button"
          className="flex items-center gap-1 w-full text-left py-0.5 px-1 rounded hover:bg-accent text-sm"
          onClick={handleToggleExpand}
        >
          {isOpen ? (
            <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight
              size={14}
              className="shrink-0 text-muted-foreground"
            />
          )}
          {isOpen ? (
            <FolderOpen size={14} className="shrink-0 text-amber-500" />
          ) : (
            <Folder size={14} className="shrink-0 text-amber-500" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {isOpen && node.children && (
          <ul className="ml-3 space-y-0.5">
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                selectedPath={selectedPath}
                onSelect={onSelect}
                forceExpand={forceExpand}
                expandedPaths={expandedPaths}
                onExpand={onExpand}
                onCollapse={onCollapse}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        className={`flex items-center gap-1 w-full text-left py-0.5 px-1 rounded text-sm ${
          isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent"
        }`}
        onClick={handleSelect}
      >
        <FileText size={14} className="shrink-0 text-blue-500" />
        <span className="truncate">{node.name}</span>
      </button>
    </li>
  );
};

export const FileTree = ({ files, selectedPath, onSelect }: FileTreeProps) => {
  const [query, setQuery] = useState("");
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() =>
    computeAutoExpandPaths(files)
  );
  const isMount = useRef(true);

  useEffect(() => {
    if (isMount.current) {
      isMount.current = false;
      return;
    }
    setExpandedPaths(computeAutoExpandPaths(files));
  }, [files]);

  const filtered = useMemo(
    () => (query ? filterTree(files, query) : files),
    [files, query]
  );

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    []
  );

  const onExpand = useCallback(
    (dirPath: string) => {
      const node = findNode(files, dirPath);
      const subPaths = node?.children
        ? computeAutoExpandPaths(node.children)
        : new Set<string>();

      setExpandedPaths((prev) => {
        if (prev.has(dirPath)) {
          return prev;
        }
        const next = new Set([...prev, dirPath, ...subPaths]);
        return next;
      });
    },
    [files]
  );

  const onCollapse = useCallback((dirPath: string) => {
    setExpandedPaths((prev) => {
      if (!prev.has(dirPath)) {
        return prev;
      }
      const next = new Set<string>();
      const prefix = `${dirPath}/`;
      for (const p of prev) {
        if (p !== dirPath && !p.startsWith(prefix)) {
          next.add(p);
        }
      }
      return next;
    });
  }, []);

  return (
    <div>
      <div className="relative mb-3">
        <Search
          size={14}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search files..."
          className="w-full pl-7 pr-12 py-1 text-sm rounded border border-border bg-transparent placeholder:text-muted-foreground focus:outline-none focus:border-ring"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-xs text-muted-foreground">
          <kbd className="border border-border rounded px-1.5 py-0.5">⌘</kbd>
          <kbd className="border border-border rounded px-1.5 py-0.5">P</kbd>
        </div>
      </div>
      <ul className="space-y-0.5">
        {filtered.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            selectedPath={selectedPath}
            onSelect={onSelect}
            forceExpand={!!query}
            expandedPaths={expandedPaths}
            onExpand={onExpand}
            onCollapse={onCollapse}
          />
        ))}
      </ul>
    </div>
  );
};
