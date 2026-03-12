import { useState, useEffect } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { FileNode } from "../shared/types.js";
import { fetchFiles, fetchFile } from "./api.js";
import { FileTree } from "./components/FileTree.js";
import { Preview } from "./components/Preview.js";
import { Source } from "./components/Source.js";
import { ThemeToggle } from "./components/ThemeToggle.js";
import { QuickOpen } from "./components/QuickOpen.js";

type ViewMode = "preview" | "source";

export function App() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quickOpenVisible, setQuickOpenVisible] = useState(false);

  useHotkey("Mod+P", () => setQuickOpenVisible(true));
  useHotkey("Mod+B", () => setSidebarOpen((v) => !v));

  useEffect(() => {
    fetchFiles()
      .then((f) => {
        setFiles(f);
        const first = findFirstFile(f);
        if (first) setSelectedPath(first);
      })
      .catch((err) => console.error("Failed to load files:", err));
  }, []);

  useEffect(() => {
    if (!selectedPath) return;
    fetchFile(selectedPath)
      .then(setContent)
      .catch((err) => console.error("Failed to load file:", err));
  }, [selectedPath]);

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* サイドバー */}
      {sidebarOpen && (
        <aside className="w-64 border-r border-border overflow-y-auto p-4 bg-secondary">
          <h1 className="text-lg font-bold mb-4">mdv</h1>
          <FileTree
            files={files}
            selectedPath={selectedPath}
            onSelect={setSelectedPath}
          />
        </aside>
      )}

      {/* メインエリア */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <header className="flex items-center gap-2 border-b border-border px-4 py-2 bg-secondary">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-accent"
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              className={`px-3 py-1 text-sm ${viewMode === "preview" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
              onClick={() => setViewMode("preview")}
            >
              Preview
            </button>
            <button
              className={`px-3 py-1 text-sm ${viewMode === "source" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
              onClick={() => setViewMode("source")}
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
          {selectedPath ? (
            viewMode === "preview" ? (
              <Preview content={content} />
            ) : (
              <Source content={content} />
            )
          ) : (
            <p className="text-muted-foreground">ファイルを選択してください</p>
          )}
        </div>
      </main>
      <QuickOpen
        files={files}
        open={quickOpenVisible}
        onClose={() => setQuickOpenVisible(false)}
        onSelect={setSelectedPath}
      />
    </div>
  );
}

function findFirstFile(files: FileNode[]): string | null {
  for (const f of files) {
    if (!f.children) return f.path;
    const child = findFirstFile(f.children);
    if (child) return child;
  }
  return null;
}
