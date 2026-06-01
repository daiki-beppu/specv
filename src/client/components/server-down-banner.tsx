import type { ServerStatus } from "@/hooks/use-server-status";

import { Button } from "./ui/button";

const reloadPage = () => {
  window.location.reload();
};

// サーバー停止 (SSE 切断 grace 経過 or 初回 API のネットワークエラー) を
// 無言の白画面にせず明示し、リロードで復帰する手段を提供する。
export const ServerDownBanner = ({ status }: { status: ServerStatus }) => {
  if (status !== "disconnected") {
    return null;
  }

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive"
    >
      <span>
        サーバーとの接続が切れました。サーバーが停止している可能性があります。
      </span>
      <Button variant="destructive" size="sm" onClick={reloadPage}>
        再読み込み
      </Button>
    </div>
  );
};
