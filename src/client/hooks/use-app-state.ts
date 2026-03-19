import type React from "react";
import { useCallback, useState } from "react";

import { useContentState } from "@/hooks/use-content-state";
import { useHotkeys } from "@/hooks/use-hotkeys";

export type ViewMode = "preview" | "source";

const useAppHandlers = (
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>,
  setQuickOpenVisible: React.Dispatch<React.SetStateAction<boolean>>
) => ({
  handleCloseQuickOpen: useCallback(
    () => setQuickOpenVisible(false),
    [setQuickOpenVisible]
  ),
  handleSetPreview: useCallback(() => setViewMode("preview"), [setViewMode]),
  handleSetSource: useCallback(() => setViewMode("source"), [setViewMode]),
});

export const useAppState = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quickOpenVisible, setQuickOpenVisible] = useState(false);

  useHotkeys(setQuickOpenVisible, setSidebarOpen);

  return {
    ...useAppHandlers(setViewMode, setQuickOpenVisible),
    ...useContentState(),
    quickOpenVisible,
    setSidebarOpen,
    sidebarOpen,
    viewMode,
  };
};
