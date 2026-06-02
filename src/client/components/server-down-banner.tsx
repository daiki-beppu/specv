import type { ServerStatus } from "@/hooks/use-server-status";

import { Button } from "./ui/button";

// サーバー停止後にユーザーがターミナルで再実行する起動コマンド。
export const RESTART_COMMAND = "bunx specv@latest";

const reloadPage = () => {
  window.location.reload();
};

// サーバー停止 (SSE 切断 grace 経過 or 初回 API のネットワークエラー) を
// 無言の白画面にせず明示する。サーバープロセスは既に終了しているため
// リロード単体では復帰できず、ターミナルでの起動コマンド再実行を案内する。
export const ServerDownBanner = ({ status }: { status: ServerStatus }) => {
  if (status !== "disconnected") {
    return null;
  }

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive sm:flex-row sm:justify-center sm:gap-3"
    >
      <span>
        サーバーとの接続が切れました。サーバープロセスが停止している可能性があります。
      </span>
      <span className="flex flex-wrap items-center justify-center gap-1">
        ターミナルで
        <code className="rounded bg-destructive/15 px-1.5 py-0.5 font-mono">
          {RESTART_COMMAND}
        </code>
        を再実行してください。
      </span>
      <Button variant="destructive" size="sm" onClick={reloadPage}>
        再読み込み
      </Button>
    </div>
  );
};
