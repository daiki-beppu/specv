import { cn } from "@/lib/utils";

interface ResizeHandleProps {
  isDragging: boolean;
  onDoubleClick: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

export const ResizeHandle = ({
  isDragging,
  onDoubleClick,
  onMouseDown,
}: ResizeHandleProps) => (
  <div
    role="separator"
    aria-orientation="vertical"
    className={cn(
      "relative w-1 shrink-0 cursor-col-resize hover:bg-ring transition-colors",
      "before:absolute before:inset-y-0 before:-left-1 before:-right-1",
      isDragging && "bg-ring"
    )}
    onDoubleClick={onDoubleClick}
    onMouseDown={onMouseDown}
  />
);
