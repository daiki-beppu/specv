import type {
  FileChangedEvent,
  FileNode,
  TreeChangedEvent,
} from "@shared/types";
import { useEffect, useRef } from "react";

import { fetchFile } from "@/api";
import { handleFileChanged, handleTreeChanged } from "@/hooks/watch-handler";

export const useWatch = (
  selectedPath: string | null,
  setContent: (content: string) => void,
  setFiles: (files: FileNode[]) => void,
  setSelectedPath: (path: string | null) => void,
  setError?: (error: string | null) => void
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
          setError?.(null);
        } catch {
          // Watch 中のエラーは非致命的（次の変更で自動リトライ）
        }
      },
      setFiles,
      setSelectedPath,
    };

    es.addEventListener("file-changed", (e) => {
      const data: FileChangedEvent = JSON.parse(e.data);
      handleFileChanged(data.path, selectedPathRef.current, actions);
    });

    es.addEventListener("tree-changed", (e) => {
      const data: TreeChangedEvent = JSON.parse(e.data);
      handleTreeChanged(data.files, selectedPathRef.current, actions);
    });

    return () => es.close();
  }, [setContent, setFiles, setSelectedPath, setError]);
};
