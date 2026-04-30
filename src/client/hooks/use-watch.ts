import {
  isFileChangedPayload,
  isTreeChangedPayload,
  type FileNode,
} from "@shared/types";
import { useEffect, useRef } from "react";

import { fetchFile } from "@/api";
import { logError } from "@/lib/logger";
import { handleFileChanged, handleTreeChanged } from "@/utils/watch-handler";

const safeJsonParse = (raw: unknown): unknown => {
  if (typeof raw !== "string") {
    return undefined;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export const useWatch = (
  selectedPath: string | null,
  setContent: (content: string) => void,
  setFiles: (files: FileNode[]) => void,
  setSelectedPath: (path: string | null) => void
): void => {
  const selectedPathRef = useRef(selectedPath);
  selectedPathRef.current = selectedPath;

  useEffect(() => {
    const es = new EventSource("/api/watch");

    const actions = {
      fetchAndSetContent: async (path: string) => {
        try {
          const content = await fetchFile(path);
          setContent(content);
        } catch (error) {
          logError("Failed to fetch file in watcher:", error);
        }
      },
      setFiles,
      setSelectedPath,
    };

    es.addEventListener("file-changed", (e) => {
      const payload = safeJsonParse(e.data);
      if (!isFileChangedPayload(payload)) {
        return;
      }
      handleFileChanged(payload.path, selectedPathRef.current, actions);
    });

    es.addEventListener("tree-changed", (e) => {
      const payload = safeJsonParse(e.data);
      if (!isTreeChangedPayload(payload)) {
        return;
      }
      handleTreeChanged(payload.files, selectedPathRef.current, actions);
    });

    return () => es.close();
  }, [setContent, setFiles, setSelectedPath]);
};
