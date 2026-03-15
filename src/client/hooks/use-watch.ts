import type { FileNode } from "@shared/types";
import { useEffect, useRef } from "react";

import { fetchFile } from "@/api";
import { handleFileChanged, handleTreeChanged } from "@/utils/watch-handler";

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
          console.error(error);
        }
      },
      setFiles,
      setSelectedPath,
    };

    es.addEventListener("file-changed", (e) => {
      const { path } = JSON.parse(e.data);
      handleFileChanged(path, selectedPathRef.current, actions);
    });

    es.addEventListener("tree-changed", (e) => {
      const { files } = JSON.parse(e.data);
      handleTreeChanged(files, selectedPathRef.current, actions);
    });

    return () => es.close();
  }, [setContent, setFiles, setSelectedPath]);
};
