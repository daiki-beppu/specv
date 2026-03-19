import { useCallback, useEffect } from "react";

import { ContentArea } from "./components/content-area";
import { Header } from "./components/header";
import { QuickOpen } from "./components/quick-open";
import { Sidebar } from "./components/sidebar";
import { useAppState } from "./hooks/use-app-state";

const useLifecycle = () => {
  useEffect(() => {
    const es = new EventSource("/api/lifecycle");
    return () => es.close();
  }, []);
};

export const App = () => {
  useLifecycle();

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
    setSidebarOpen,
    sidebarOpen,
    viewMode,
  } = useAppState();

  const handleToggleSidebar = useCallback(
    () => setSidebarOpen((v) => !v),
    [setSidebarOpen]
  );

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <Header
        selectedPath={selectedPath}
        sidebarOpen={sidebarOpen}
        viewMode={viewMode}
        onSetPreview={handleSetPreview}
        onSetSource={handleSetSource}
        onToggleSidebar={handleToggleSidebar}
      />

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <Sidebar
            files={files}
            selectedPath={selectedPath}
            onSelect={setSelectedPath}
          />
        )}

        <main className="flex-1 overflow-y-auto px-8 py-8" ref={scrollRef}>
          <ContentArea
            content={content}
            selectedPath={selectedPath}
            viewMode={viewMode}
            onNavigate={setSelectedPath}
          />
        </main>
      </div>

      <QuickOpen
        files={files}
        open={quickOpenVisible}
        onClose={handleCloseQuickOpen}
        onSelect={setSelectedPath}
      />
    </div>
  );
};
