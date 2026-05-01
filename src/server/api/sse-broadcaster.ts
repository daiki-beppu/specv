import type { WatchEventName } from "@shared/types";

export interface SseMessage {
  data: string;
  event: WatchEventName;
}

type SseListener = (msg: SseMessage) => void;

export interface SseBroadcaster {
  attachSseStream: () => Response;
  broadcast: (msg: SseMessage) => void;
}

export const createSseBroadcaster = (): SseBroadcaster => {
  const listeners = new Set<SseListener>();
  const encoder = new TextEncoder();

  const broadcast = (msg: SseMessage) => {
    for (const listener of listeners) {
      listener(msg);
    }
  };

  const attachSseStream = (): Response => {
    let listener: SseListener | null = null;

    const stream = new ReadableStream({
      cancel() {
        if (listener !== null) {
          listeners.delete(listener);
        }
      },
      start(controller) {
        listener = (msg) => {
          controller.enqueue(
            encoder.encode(`event: ${msg.event}\ndata: ${msg.data}\n\n`)
          );
        };
        listeners.add(listener);
      },
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
      },
    });
  };

  return { attachSseStream, broadcast };
};
