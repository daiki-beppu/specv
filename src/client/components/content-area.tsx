import type { ViewMode } from "@/hooks/use-app-state";

import { Preview } from "./preview";
import { Source } from "./source";

interface ContentAreaProps {
  content: string;
  selectedPath: string | null;
  viewMode: ViewMode;
  onNavigate: (path: string) => void;
}

export const ContentArea = ({
  content,
  selectedPath,
  viewMode,
  onNavigate,
}: ContentAreaProps) => {
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
