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
import { ButtonGroup } from "./components/ui/button-group";
import {
  SIDEBAR_DEFAULT_WIDTH,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarRail,
  useSidebar,
} from "./components/ui/sidebar";
import { useScrollRestore } from "./hooks/use-scroll-restore";
import { useWatch } from "./hooks/use-watch";
import { logError } from "./lib/logger";
import { findFirstFile } from "./utils/auto-expand";

type ViewMode = "preview" | "source";

const renderContent = (
  selectedPath: string | null,
  viewMode: ViewMode,
  content: string,
  onNavigate: (path: string) => void
) => {
  if (selectedPath === null || selectedPath === "") {
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
        if (first !== null) {
          setSelectedPath(first);
        }
      } catch (error) {
        logError("Failed to load files:", error);
      }
    };
    void load();
  }, [setFiles, setSelectedPath]);
};

const useLoadContent = (
  selectedPath: string | null,
  setContent: (c: string) => void
) => {
  useEffect(() => {
    if (selectedPath === null || selectedPath === "") {
      return;
    }
    const load = async () => {
      try {
        const text = await fetchFile(selectedPath);
        setContent(text);
      } catch (error) {
        logError("Failed to load file:", error);
      }
    };
    void load();
  }, [selectedPath, setContent]);
};

const useAppHandlers = (
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>,
  setQuickOpenVisible: React.Dispatch<React.SetStateAction<boolean>>
) => ({
  handleCloseQuickOpen: useCallback(() => {
    setQuickOpenVisible(false);
  }, [setQuickOpenVisible]),
  handleSetPreview: useCallback(() => {
    setViewMode("preview");
  }, [setViewMode]),
  handleSetSource: useCallback(() => {
    setViewMode("source");
  }, [setViewMode]),
});

const useHotkeys = (
  setQuickOpenVisible: React.Dispatch<React.SetStateAction<boolean>>
) => {
  useHotkey("Mod+P", () => {
    setQuickOpenVisible(true);
  });
};

const useLifecycle = () => {
  useEffect(() => {
    const es = new EventSource("/api/lifecycle");
    return () => {
      es.close();
    };
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
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [quickOpenVisible, setQuickOpenVisible] = useState(false);

  useHotkeys(setQuickOpenVisible);

  return {
    ...useAppHandlers(setViewMode, setQuickOpenVisible),
    ...useContentState(),
    quickOpenVisible,
    viewMode,
  };
};

const AppContent = () => {
  const { isMobile, open, openMobile, toggleSidebar } = useSidebar();
  const isOpen = isMobile ? openMobile : open;

  const {
    content,
    files,
    handleCloseQuickOpen,
    handleSetPreview,
    handleSetSource,
    quickOpenVisible,
    scrollRef,
    selectedPath,
    setSelectedPath,
    viewMode,
  } = useAppState();

  const handleSelect = useCallback(
    (path: string) => {
      setSelectedPath(path);
      if (isMobile) {
        toggleSidebar();
      }
    },
    [setSelectedPath, isMobile, toggleSidebar]
  );

  return (
    <>
      {/* サイドバー */}
      <Sidebar collapsible="offcanvas">
        <SidebarHeader className="p-4">
          <h1 className="text-lg font-bold">specv</h1>
        </SidebarHeader>
        <SidebarContent className="overflow-y-auto px-4 pt-2 pb-4">
          <FileTree
            files={files}
            selectedPath={selectedPath}
            onSelect={handleSelect}
          />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      {/* メインエリア */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <header className="flex items-center gap-2 border-b border-border px-4 py-2 bg-secondary">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            title={`${isOpen ? "Hide sidebar" : "Show sidebar"} (⌘B)`}
          >
            {isOpen ? (
              <PanelLeftClose size={16} />
            ) : (
              <PanelLeftOpen size={16} />
            )}
          </Button>
          <ButtonGroup
            role="tablist"
            className="rounded-lg border border-border"
          >
            <Button
              variant={viewMode === "preview" ? "default" : "ghost"}
              size="sm"
              role="tab"
              aria-selected={viewMode === "preview"}
              onClick={handleSetPreview}
            >
              Preview
            </Button>
            <Button
              variant={viewMode === "source" ? "default" : "ghost"}
              size="sm"
              role="tab"
              aria-selected={viewMode === "source"}
              onClick={handleSetSource}
            >
              Source
            </Button>
          </ButtonGroup>
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
    </>
  );
};

export const App = () => {
  useLifecycle();

  return (
    <SidebarProvider
      className="h-screen overflow-hidden bg-background text-foreground"
      style={{
        "--sidebar-width": `${String(SIDEBAR_DEFAULT_WIDTH)}px`,
      }}
    >
      <AppContent />
    </SidebarProvider>
  );
};
