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
import { Button } from "./components/ui/button";
import { useIsMobile } from "./hooks/use-is-mobile";
import { useResizable } from "./hooks/use-resizable";
import { useScrollRestore } from "./hooks/use-scroll-restore";
import { useWatch } from "./hooks/use-watch";
import { cn } from "./lib/utils";
import { findFirstFile } from "./utils/auto-expand";

type ViewMode = "preview" | "source";

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
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>,
  isMobile: boolean
) => {
  const sidebarRef = useRef<HTMLElement>(null);
  const { isDragging, onDoubleClick, onMouseDown, width } =
    useResizable(sidebarRef);

  return {
    handleCloseSidebar: useCallback(
      () => setSidebarOpen(false),
      [setSidebarOpen]
    ),
    handleToggleSidebar: useCallback(
      () => setSidebarOpen((v) => !v),
      [setSidebarOpen]
    ),
    isDragging: isMobile ? false : isDragging,
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

const useContentState = () => {
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

const useAppState = () => {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [quickOpenVisible, setQuickOpenVisible] = useState(false);

  useHotkeys(setQuickOpenVisible, setSidebarOpen);

  return {
    ...useAppHandlers(setViewMode, setQuickOpenVisible),
    ...useContentState(),
    ...useSidebar(setSidebarOpen, isMobile),
    isMobile,
    quickOpenVisible,
    sidebarOpen,
    viewMode,
  };
};

export const App = () => {
  useLifecycle();

  const {
    content,
    files,
    handleCloseSidebar,
    handleCloseQuickOpen,
    handleSetPreview,
    handleSetSource,
    handleToggleSidebar,
    isDragging,
    isMobile,
    onDoubleClick,
    onMouseDown,
    quickOpenVisible,
    scrollRef,
    selectedPath,
    setSelectedPath,
    sidebarOpen,
    sidebarRef,
    sidebarWidth,
    viewMode,
  } = useAppState();

  const handleSelect = useCallback(
    (path: string) => {
      setSelectedPath(path);
      if (isMobile) {
        handleCloseSidebar();
      }
    },
    [setSelectedPath, isMobile, handleCloseSidebar]
  );

  return (
    <div
      className={cn(
        "flex h-screen bg-background text-foreground",
        isDragging && "select-none cursor-col-resize"
      )}
    >
      {/* バックドロップ（モバイル） */}
      {isMobile && sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 border-none p-0 cursor-default"
          data-testid="sidebar-backdrop"
          onClick={handleCloseSidebar}
          aria-label="Close sidebar"
        />
      )}

      {/* サイドバー */}
      {sidebarOpen && (
        <>
          <aside
            ref={sidebarRef}
            className={cn(
              "shrink-0 border-r border-border overflow-y-auto p-4 bg-secondary",
              isMobile
                ? "fixed inset-y-0 left-0 z-40 w-[280px]"
                : "transition-[width] duration-200",
              !isMobile && isDragging && "!transition-none"
            )}
            style={isMobile ? undefined : { width: sidebarWidth }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <img
                  src="/favicon.png"
                  alt=""
                  width={20}
                  height={20}
                  className="rounded-full"
                />
                <h1 className="text-lg font-bold">specv</h1>
              </div>
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseSidebar}
                  title="Close sidebar"
                >
                  <PanelLeftClose size={16} />
                </Button>
              )}
            </div>
            <FileTree
              files={files}
              selectedPath={selectedPath}
              onSelect={handleSelect}
            />
          </aside>
          {!isMobile && (
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
          )}
        </>
      )}

      {/* メインエリア */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <header className="flex items-center gap-2 border-b border-border px-4 py-2 bg-secondary">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleSidebar}
            title={`${sidebarOpen ? "Hide sidebar" : "Show sidebar"} (⌘B)`}
          >
            {sidebarOpen ? (
              <PanelLeftClose size={16} />
            ) : (
              <PanelLeftOpen size={16} />
            )}
          </Button>
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
              onClick={handleSetPreview}
            >
              Preview
            </Button>
            <Button
              variant={viewMode === "source" ? "default" : "ghost"}
              size="sm"
              role="tab"
              aria-selected={viewMode === "source"}
              className="rounded-none"
              onClick={handleSetSource}
            >
              Source
            </Button>
          </div>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground truncate hidden md:inline">
            {selectedPath}
          </span>
          <ThemeToggle />
        </header>

        {/* コンテンツ */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-8"
        >
          {renderContent(selectedPath, viewMode, content, setSelectedPath)}
        </div>
      </main>
      <QuickOpen
        files={files}
        open={quickOpenVisible}
        onClose={handleCloseQuickOpen}
        onSelect={handleSelect}
      />
    </div>
  );
};
