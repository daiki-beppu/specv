import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

interface TreeProps {
  children: ReactNode;
  className?: string;
}

const Tree = ({ children, className }: TreeProps) => (
  <ul className={cn("flex flex-col gap-0.5", className)} role="tree">
    {children}
  </ul>
);

interface TreeItemProps {
  children?: ReactNode;
  className?: string;
  expanded: boolean;
  icon?: ReactNode;
  name: string;
  onToggle: () => void;
}

const TreeItem = ({
  children,
  className,
  expanded,
  icon,
  name,
  onToggle,
}: TreeItemProps) => (
  <li aria-expanded={expanded} className={cn(className)} role="treeitem">
    <button
      className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-sm hover:bg-accent"
      onClick={onToggle}
      type="button"
    >
      {icon}
      <span className="truncate">{name}</span>
    </button>
    {expanded && children && (
      <ul className="ml-4 flex flex-col gap-0.5" role="group">
        {children}
      </ul>
    )}
  </li>
);

interface TreeLeafProps {
  className?: string;
  icon?: ReactNode;
  name: string;
  onSelect: () => void;
  selected: boolean;
}

const TreeLeaf = ({
  className,
  icon,
  name,
  onSelect,
  selected,
}: TreeLeafProps) => (
  <li aria-selected={selected} className={cn(className)} role="treeitem">
    <button
      className={cn(
        "flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-sm",
        selected ? "bg-accent text-accent-foreground" : "hover:bg-accent"
      )}
      onClick={onSelect}
      type="button"
    >
      {icon}
      <span className="truncate">{name}</span>
    </button>
  </li>
);

export { Tree, TreeItem, TreeLeaf };
export type { TreeItemProps, TreeLeafProps, TreeProps };
