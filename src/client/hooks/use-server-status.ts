import { useEffect, useState } from "react";

export type ServerStatus = "connecting" | "connected" | "disconnected";

// `/api/lifecycle` の SSE 接続でサーバー生存を監視する。
// EventSource は切断時に自動再接続を試みるため、error → open で
// connected へ復帰する（再接続の表現）。
export const useServerStatus = (): ServerStatus => {
  const [status, setStatus] = useState<ServerStatus>("connecting");

  useEffect(() => {
    const es = new EventSource("/api/lifecycle");
    const handleOpen = () => {
      setStatus("connected");
    };
    const handleError = () => {
      setStatus("disconnected");
    };
    es.addEventListener("open", handleOpen);
    es.addEventListener("error", handleError);
    // close() で接続破棄するためリスナーの明示削除は不要。
    return () => {
      es.close();
    };
  }, []);

  return status;
};
