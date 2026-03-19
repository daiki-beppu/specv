import { useHotkey } from "@tanstack/react-hotkeys";
import type React from "react";

export const useHotkeys = (
  setQuickOpenVisible: React.Dispatch<React.SetStateAction<boolean>>,
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
) => {
  useHotkey("Mod+P", () => setQuickOpenVisible(true));
  useHotkey("Mod+B", () => setSidebarOpen((v) => !v));
};
