import { Button } from "@/components/ui/button";
import type { ViewMode } from "@/hooks/use-app-state";

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onSetPreview: () => void;
  onSetSource: () => void;
}

export const ViewModeToggle = ({
  viewMode,
  onSetPreview,
  onSetSource,
}: ViewModeToggleProps) => (
  <div
    className="flex rounded-lg overflow-hidden border border-border"
    role="tablist"
  >
    <Button
      variant={viewMode === "preview" ? "default" : "ghost"}
      size="sm"
      role="tab"
      aria-selected={viewMode === "preview"}
      className="rounded-none"
      onClick={onSetPreview}
    >
      Preview
    </Button>
    <Button
      variant={viewMode === "source" ? "default" : "ghost"}
      size="sm"
      role="tab"
      aria-selected={viewMode === "source"}
      className="rounded-none"
      onClick={onSetSource}
    >
      Source
    </Button>
  </div>
);
