import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import type { ViewMode } from "@/hooks/use-app-state";

interface HeaderProps {
  selectedPath: string | null;
  sidebarOpen: boolean;
  viewMode: ViewMode;
  onSetPreview: () => void;
  onSetSource: () => void;
  onToggleSidebar: () => void;
}

export const Header = ({
  selectedPath,
  sidebarOpen,
  viewMode,
  onSetPreview,
  onSetSource,
  onToggleSidebar,
}: HeaderProps) => (
  <header className="flex items-center gap-2 border-b border-border px-4 py-2 bg-secondary">
    <img src="/favicon.png" alt="specv" className="size-6 rounded-full" />
    <span className="text-lg font-bold mr-2">specv</span>
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggleSidebar}
      title={`${sidebarOpen ? "Hide sidebar" : "Show sidebar"} (⌘B)`}
    >
      {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
    </Button>
    <ViewModeToggle
      viewMode={viewMode}
      onSetPreview={onSetPreview}
      onSetSource={onSetSource}
    />
    <div className="flex-1" />
    <span className="text-sm text-muted-foreground">{selectedPath}</span>
    <ThemeToggle />
  </header>
);
