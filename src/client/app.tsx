import type { FileNode } from "@shared/types";
import { useHotkey } from "@tanstack/react-hotkeys";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { fetchFile, fetchFiles } from "./api";
import { FileTree } from "./components/file-tree";
import { Preview } from "./components/preview";
import { QuickOpen } from "./components/quick-open";
import { Source } from "./components/source";
import { ThemeToggle } from "./components/theme-toggle";
import { useResizable } from "./hooks/use-resizable";
import { cn } from "./lib/utils";

type ViewMode = "preview" | "source";

const findFirstFile = (files: FileNode[]): string | null => {
  for (const f of files) {
    if (!f.children) {
      return f.path;
    }
    const child = findFirstFile(f.children);
    if (child) {
      return child;
    }
  }
  return null;
};

const renderContent = (
  selectedPath: string | null,
  viewMode: ViewMode,
  content: string,
  onNavigate: (path: string) => void
) => {
  if (!selectedPath) {
    return <p className="text-muted-foreground">ファイルを選択してください</p>;
  }
  if (viewMode === "preview") {
    return (
      <Preview
        content={content}
        selectedPath={selectedPath}
        onNavigate={onNavigate}
      />
    );
  }
  return <Source content={content} />;
};

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

const useHotkeys = (
  setQuickOpenVisible: React.Dispatch<React.SetStateAction<boolean>>,
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
) => {
  useHotkey("Mod+P", () => setQuickOpenVisible(true));
  useHotkey("Mod+B", () => setSidebarOpen((v) => !v));
};

const useSidebar = (
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const sidebarRef = useRef<HTMLElement>(null);
  const { isDragging, onDoubleClick, onMouseDown, width } =
    useResizable(sidebarRef);

  return {
    handleToggleSidebar: useCallback(
      () => setSidebarOpen((v) => !v),
      [setSidebarOpen]
    ),
    isDragging,
    onDoubleClick,
    onMouseDown,
    sidebarRef,
    sidebarWidth: width,
  };
};

const useLifecycle = () => {
  useEffect(() => {
    const es = new EventSource("/api/lifecycle");
    return () => es.close();
  }, []);
};

const useAppState = () => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quickOpenVisible, setQuickOpenVisible] = useState(false);

  useHotkeys(setQuickOpenVisible, setSidebarOpen);
  useLoadFiles(setFiles, setSelectedPath);
  useLoadContent(selectedPath, setContent);

  return {
    ...useAppHandlers(setViewMode, setQuickOpenVisible),
    ...useSidebar(setSidebarOpen),
    content,
    files,
    quickOpenVisible,
    selectedPath,
    setSelectedPath,
    sidebarOpen,
    viewMode,
  };
};

export const App = () => {
  useLifecycle();

  const {
    content,
    files,
    handleCloseQuickOpen,
    handleSetPreview,
    handleSetSource,
    handleToggleSidebar,
    isDragging,
    onDoubleClick,
    onMouseDown,
    quickOpenVisible,
    selectedPath,
    setSelectedPath,
    sidebarOpen,
    sidebarRef,
    sidebarWidth,
    viewMode,
  } = useAppState();

  return (
    <div
      className={cn(
        "flex h-screen bg-background text-foreground",
        isDragging && "select-none cursor-col-resize"
      )}
    >
      {/* サイドバー */}
      {sidebarOpen && (
        <>
          <aside
            ref={sidebarRef}
            className={cn(
              "shrink-0 border-r border-border overflow-y-auto p-4 bg-secondary transition-[width] duration-200",
              isDragging && "!transition-none"
            )}
            style={{ width: sidebarWidth }}
          >
            <h1 className="text-lg font-bold mb-4">specv</h1>
            <FileTree
              files={files}
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
            />
          </aside>
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
        </>
      )}

      {/* メインエリア */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <header className="flex items-center gap-2 border-b border-border px-4 py-2 bg-secondary">
          <button
            type="button"
            onClick={handleToggleSidebar}
            className="p-1.5 rounded-lg hover:bg-accent"
            title={`${sidebarOpen ? "Hide sidebar" : "Show sidebar"} (⌘B)`}
          >
            {sidebarOpen ? (
              <PanelLeftClose size={16} />
            ) : (
              <PanelLeftOpen size={16} />
            )}
          </button>
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              type="button"
              className={`px-3 py-1 text-sm ${viewMode === "preview" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
              onClick={handleSetPreview}
            >
              Preview
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-sm ${viewMode === "source" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
              onClick={handleSetSource}
            >
              Source
            </button>
          </div>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground">{selectedPath}</span>
          <ThemeToggle />
        </header>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          {renderContent(selectedPath, viewMode, content, setSelectedPath)}
        </div>
      </main>
      <QuickOpen
        files={files}
        open={quickOpenVisible}
        onClose={handleCloseQuickOpen}
        onSelect={setSelectedPath}
      />
    </div>
  );
};
