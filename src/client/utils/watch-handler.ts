import type { FileNode } from "@shared/types";

import { findFirstFile, findNode } from "./auto-expand";

interface WatchActions {
  fetchAndSetContent: (path: string) => void;
  setFiles: (files: FileNode[]) => void;
  setSelectedPath: (path: string | null) => void;
}

export const handleFileChanged = (
  eventPath: string,
  selectedPath: string | null,
  actions: WatchActions
): void => {
  if (eventPath === selectedPath) {
    actions.fetchAndSetContent(eventPath);
  }
};

export const handleTreeChanged = (
  files: FileNode[],
  selectedPath: string | null,
  actions: WatchActions
): void => {
  actions.setFiles(files);

  const stillExists = selectedPath && findNode(files, selectedPath);
  if (!stillExists) {
    actions.setSelectedPath(findFirstFile(files));
  }
};
