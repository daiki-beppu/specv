import type { Hono } from "hono";

const DISCONNECT_GRACE_MS = 2000;

export const registerLifecycleRoutes = (
  app: Hono,
  onDisconnect: () => void
): void => {
  let connections = 0;
  let graceTimer: ReturnType<typeof setTimeout> | null = null;

  app.get("/api/lifecycle", (_c) => {
    connections += 1;
    if (graceTimer !== null) {
      clearTimeout(graceTimer);
      graceTimer = null;
    }

    const stream = new ReadableStream({
      cancel() {
        connections -= 1;
        if (connections === 0) {
          graceTimer = setTimeout(() => {
            if (connections === 0) {
              onDisconnect();
            }
          }, DISCONNECT_GRACE_MS);
        }
      },
      start(controller) {
        controller.enqueue("data: connected\n\n");
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
