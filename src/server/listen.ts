import type { AddressInfo } from "node:net";

import { serve, type ServerType } from "@hono/node-server";
import type { Hono } from "hono";

import { getLocalIpAddress } from "./network";
import { openInBrowser } from "./open-browser";
import { displayQrCode } from "./qr-display";

interface ListenResult {
  port: number;
  server: ServerType;
}

// ポリシー: 複数インスタンス起動を許容する。別ディレクトリで specv を同時起動
// した場合、2 番目以降は startPort が EADDRINUSE のたびに次ポートへフォールバック
// して独立に bind する。これにより「後勝ち」でポートを奪い合うことがなく、各画面
// は自身のディレクトリ内容を表示し続ける（Issue #142）。
export const listenWithFallback = (
  app: Hono,
  hostname: string,
  startPort: number,
  maxRetries = 10
): Promise<ListenResult> =>
  new Promise<ListenResult>((resolve, reject) => {
    const attempt = (port: number, retriesLeft: number): void => {
      const server = serve(
        { fetch: app.fetch, hostname, port },
        (info: AddressInfo) => {
          resolve({ port: info.port, server });
        }
      );

      server.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE" && retriesLeft > 0) {
          console.log(`Port ${port} is in use, trying ${port + 1}...`);
          attempt(port + 1, retriesLeft - 1);
        } else {
          reject(err);
        }
      });
    };

    attempt(startPort, maxRetries);
  });

interface AnnounceParams {
  port: number;
  baseDir: string;
  enableNetwork: boolean;
  version: string;
}

// 実際に bind した port を起動バナー・ブラウザ open URL に反映する。
// 固定ポートを決め打ちしないことが Issue #142 要件4 の核心。
export const announceAndOpen = async ({
  port,
  baseDir,
  enableNetwork,
  version,
}: AnnounceParams): Promise<void> => {
  const localUrl = `http://localhost:${port}`;
  console.log("");
  console.log(`  specv v${version}`);
  console.log("");
  console.log(`  ➜  Local:   ${localUrl}`);

  const ip = enableNetwork ? getLocalIpAddress() : null;
  const networkUrl = ip === null ? null : `http://${ip}:${port}`;

  if (networkUrl !== null) {
    console.log(`  ➜  Network: ${networkUrl}`);
  } else if (!enableNetwork) {
    console.log("  ➜  Network: use --host to expose to local network");
  }

  console.log("");
  console.log(`  Serving: ${baseDir}`);

  // Dev:host 時は Vite プラグイン側で QR を表示するためスキップ。
  // SPECV_HOST="" は未設定と同義として扱う（vite.config.ts の Boolean(process.env.SPECV_HOST) と整合）
  if (
    networkUrl !== null &&
    (process.env.SPECV_HOST === undefined || process.env.SPECV_HOST === "")
  ) {
    console.log("");
    displayQrCode(networkUrl);
  }

  console.log("");
  console.log("  Press Ctrl+C to stop");

  try {
    await openInBrowser(localUrl);
  } catch {
    console.log(`  Open ${localUrl} in your browser`);
  }
};
