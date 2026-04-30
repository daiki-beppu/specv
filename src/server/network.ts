import os from "node:os";

export const getLocalIpAddress = (): string | null => {
  const interfaces = os.networkInterfaces();
  for (const addrs of Object.values(interfaces)) {
    if (addrs === undefined) {
      continue;
    }
    for (const addr of addrs) {
      if (addr.family === "IPv4" && !addr.internal) {
        return addr.address;
      }
    }
  }
  return null;
};
