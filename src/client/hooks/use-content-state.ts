import type { FileNode } from "@shared/types";
import { useEffect, useRef, useState } from "react";

import { fetchFile, fetchFiles } from "@/api";
import { useScrollRestore } from "@/hooks/use-scroll-restore";
import { useWatch } from "@/hooks/use-watch";
import { findFirstFile } from "@/utils/auto-expand";

const useLoadFiles = (
  setFiles: (f: FileNode[]) => void,
  setSelectedPath: (p: string | null) => void
) => {
  useEffect(() => {
    const load = async () => {
      try {
        const f = await fetchFiles();
        setFiles(f);
        const first = findFirstFile(f);
        if (first) {
          setSelectedPath(first);
        }
      } catch (error) {
        console.error("Failed to load files:", error);
      }
    };
    load();
  }, [setFiles, setSelectedPath]);
};

const useLoadContent = (
  selectedPath: string | null,
  setContent: (c: string) => void
) => {
  useEffect(() => {
    if (!selectedPath) {
      return;
    }
    const load = async () => {
      try {
        const text = await fetchFile(selectedPath);
        setContent(text);
      } catch (error) {
        console.error("Failed to load file:", error);
      }
    };
    load();
  }, [selectedPath, setContent]);
};

export const useContentState = () => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useLoadFiles(setFiles, setSelectedPath);
  useLoadContent(selectedPath, setContent);
  useWatch(selectedPath, setContent, setFiles, setSelectedPath);
  useScrollRestore(scrollRef, selectedPath);

  return { content, files, scrollRef, selectedPath, setSelectedPath };
};
