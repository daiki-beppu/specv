import { useState } from "react";
import type { FileNode } from "../../shared/types.js";

interface FileTreeProps {
  files: FileNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

export function FileTree({ files, selectedPath, onSelect }: FileTreeProps) {
  return (
    <ul className="space-y-0.5">
      {files.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

function TreeNode({
  node,
  selectedPath,
  onSelect,
}: {
  node: FileNode;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isDir = !!node.children;
  const isSelected = node.path === selectedPath;

  if (isDir) {
    return (
      <li>
        <button
          className="flex items-center gap-1 w-full text-left py-0.5 px-1 rounded hover:bg-gray-100 dark:hover:bg-gh-bg-tertiary text-sm"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="text-xs">{expanded ? "\u25BC" : "\u25B6"}</span>
          <span>{"\uD83D\uDCC1"} {node.name}</span>
        </button>
        {expanded && node.children && (
          <ul className="ml-3 space-y-0.5">
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                selectedPath={selectedPath}
                onSelect={onSelect}
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
