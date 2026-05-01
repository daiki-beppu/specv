import type { FileNode } from "@shared/types";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";
import { useCallback } from "react";

import { TreeItem, TreeLeaf } from "@/components/ui/tree";

interface FileTreeNodeProps {
  node: FileNode;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  forceExpand: boolean;
  expandedPaths: Set<string>;
  onExpand: (dirPath: string) => void;
  onCollapse: (dirPath: string) => void;
}

export const FileTreeNode = ({
  node,
  selectedPath,
  onSelect,
  forceExpand,
  expandedPaths,
  onExpand,
  onCollapse,
}: FileTreeNodeProps) => {
  const isDir = node.children !== undefined;
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
      <TreeItem
        expanded={isOpen}
        icon={
          <>
            {isOpen ? (
              <ChevronDown
                size={14}
                className="shrink-0 text-muted-foreground"
              />
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
          </>
        }
        name={node.name}
        onToggle={handleToggleExpand}
      >
        {node.children?.map((child) => (
          <FileTreeNode
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
      </TreeItem>
    );
  }

  return (
    <TreeLeaf
      icon={<FileText size={14} className="shrink-0 text-blue-500" />}
      name={node.name}
      onSelect={handleSelect}
      selected={node.path === selectedPath}
    />
  );
};
