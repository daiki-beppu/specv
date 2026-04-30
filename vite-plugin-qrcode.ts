import type { Plugin } from "vite-plus";

import { getLocalIpAddress } from "./src/server/network.ts";
import { displayQrCode } from "./src/server/qr-display.ts";

export const qrcodePlugin = (): Plugin => ({
  apply: "serve",
  configureServer(server) {
    if (process.env.SPECV_HOST === undefined || process.env.SPECV_HOST === "") {
      return;
    }

    server.httpServer?.once("listening", () => {
      const ip = getLocalIpAddress();
      if (ip === null) {
        return;
      }

      const address = server.httpServer?.address();
      if (
        address === null ||
        address === undefined ||
        typeof address === "string"
      ) {
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
