import { useState } from "react";
import { Search } from "lucide-react";
import type { FileNode } from "../../shared/types.js";

interface FileTreeProps {
  files: FileNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

function filterTree(nodes: FileNode[], query: string): FileNode[] {
  const lower = query.toLowerCase();
  return nodes.reduce<FileNode[]>((acc, node) => {
    if (node.children) {
      const filtered = filterTree(node.children, query);
      if (filtered.length > 0) {
        acc.push({ ...node, children: filtered });
      }
    } else if (node.name.toLowerCase().includes(lower) || node.path.toLowerCase().includes(lower)) {
      acc.push(node);
    }
    return acc;
  }, []);
}

export function FileTree({ files, selectedPath, onSelect }: FileTreeProps) {
  const [query, setQuery] = useState("");
  const filtered = query ? filterTree(files, query) : files;

  return (
    <div>
      <div className="relative mb-3">
        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gh-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files..."
          className="w-full pl-7 pr-2 py-1 text-sm rounded border border-gray-300 dark:border-gh-border bg-transparent dark:bg-gh-bg-primary placeholder:text-gh-text-muted focus:outline-none focus:border-gh-accent"
        />
      </div>
      <ul className="space-y-0.5">
        {filtered.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            selectedPath={selectedPath}
            onSelect={onSelect}
            forceExpand={!!query}
          />
        ))}
      </ul>
    </div>
  );
}

function TreeNode({
  node,
  selectedPath,
  onSelect,
  forceExpand,
}: {
  node: FileNode;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  forceExpand: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isDir = !!node.children;
  const isSelected = node.path === selectedPath;
  const isOpen = forceExpand || expanded;

  if (isDir) {
    return (
      <li>
        <button
          className="flex items-center gap-1 w-full text-left py-0.5 px-1 rounded hover:bg-gray-100 dark:hover:bg-gh-bg-tertiary text-sm"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="text-xs">{isOpen ? "\u25BC" : "\u25B6"}</span>
          <span>{"\uD83D\uDCC1"} {node.name}</span>
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
        className={`flex items-center gap-1 w-full text-left py-0.5 px-1 rounded text-sm ${
          isSelected
            ? "bg-blue-100 text-blue-800 dark:bg-gh-bg-tertiary dark:text-gh-text-primary"
            : "hover:bg-gray-100 dark:hover:bg-gh-bg-tertiary"
        }`}
        onClick={() => onSelect(node.path)}
      >
        <span>{"\uD83D\uDCC4"} {node.name}</span>
      </button>
    </li>
  );
}
