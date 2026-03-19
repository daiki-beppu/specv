import type { Plugin } from "vite";

import { getLocalIpAddress } from "./src/server/network";
import { displayQrCode } from "./src/server/qr-display";

export const qrcodePlugin = (): Plugin => ({
  apply: "serve",
  configureServer(server) {
    if (!process.env.SPECV_HOST) {
      return;
    }

    server.httpServer?.once("listening", () => {
      const ip = getLocalIpAddress();
      if (!ip) {
        return;
      }

      const address = server.httpServer?.address();
      if (!address || typeof address === "string") {
        return;
      }

      const networkUrl = `http://${ip}:${address.port}`;

      // Vite の出力の後に表示されるよう少し遅延
      setTimeout(() => {
        console.log("");
        displayQrCode(networkUrl);
      }, 100);
    });
  },
  name: "vite-plugin-qrcode",
});
