import type { FileNode } from "@shared/types";
import { useRef } from "react";

import { FileTree } from "@/components/file-tree";
import { ResizeHandle } from "@/components/resize-handle";
import { useResizable } from "@/hooks/use-resizable";
import { cn } from "@/lib/utils";

interface SidebarProps {
  files: FileNode[];
  selectedPath: string | null;
  onSelect: (path: string | null) => void;
}

export const Sidebar = ({ files, selectedPath, onSelect }: SidebarProps) => {
  const sidebarRef = useRef<HTMLElement>(null);
  const { isDragging, onDoubleClick, onMouseDown, width } =
    useResizable(sidebarRef);

  return (
    <>
      <aside
        ref={sidebarRef}
        className={cn(
          "shrink-0 border-r border-border overflow-y-auto p-4 bg-secondary transition-[width] duration-200",
          isDragging && "!transition-none"
        )}
        style={{ width }}
      >
        <FileTree
          files={files}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      </aside>
      <ResizeHandle
        isDragging={isDragging}
        onDoubleClick={onDoubleClick}
        onMouseDown={onMouseDown}
      />
    </>
  );
};
