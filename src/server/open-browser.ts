import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCb);

const getCommand = (url: string) => {
  if (process.platform === "darwin") {
    return { args: [url], command: "open" };
  }

  if (process.platform === "win32") {
    return { args: ["/c", "start", "", url], command: "cmd" };
  }

  return { args: [url], command: "xdg-open" };
};

export const openInBrowser = async (url: string): Promise<void> => {
  const { args, command } = getCommand(url);
  await execFile(command, args);
};
