import type { Hono } from "hono";

// SSE が一時的に切れても即サーバー停止しないための再接続猶予。
// ブラウザの EventSource 既定再接続間隔 (約 3s) を十分に上回る値にする。
export const DISCONNECT_GRACE_MS = 10000;

// keep-alive 用の heartbeat 送出間隔。アイドル接続が
// プロキシ/省電力モードで切断されるのを防ぐ。
export const LIFECYCLE_HEARTBEAT_INTERVAL_MS = 15000;

// SSE エンドポイントの提供（インフラ）と自動停止（ポリシー）を分離する。
// `onDisconnect` 未指定（`--no-auto-close`）でも `/api/lifecycle` は常に登録し、
// grace 経過時の副作用だけを省く。
export const registerLifecycle = (app: Hono, onDisconnect?: () => void) => {
  let connections = 0;
  let graceTimer: ReturnType<typeof setTimeout> | null = null;

  app.get("/api/lifecycle", (_c) => {
    connections += 1;
    if (graceTimer !== null) {
      clearTimeout(graceTimer);
      graceTimer = null;
    }

    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    const stream = new ReadableStream({
      cancel() {
        if (heartbeatTimer !== null) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
        connections -= 1;
        if (connections === 0) {
          graceTimer = setTimeout(() => {
            graceTimer = null;
            if (connections === 0) {
              onDisconnect?.();
            }
          }, DISCONNECT_GRACE_MS);
        }
      },
      start(controller) {
        controller.enqueue("data: connected\n\n");
        // SSE コメント行 (":" 始まり) は EventSource にイベントとして拾われず、
        // data ハンドラを汚さずに接続を維持できる。
        heartbeatTimer = setInterval(() => {
          controller.enqueue(": heartbeat\n\n");
        }, LIFECYCLE_HEARTBEAT_INTERVAL_MS);
      },
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
      },
    });
  });
};
