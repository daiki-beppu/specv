import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const createTmpDir = () =>
  fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "specv-test-")));

export const removeTmpDir = (dir: string) => {
  fs.rmSync(dir, { recursive: true });
};

export const createFile = (
  tmpDir: string,
  relativePath: string,
  content: string | Buffer = ""
) => {
  const fullPath = path.join(tmpDir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
};

export const withTmpDir = async (
  fn: (tmpDir: string) => Promise<void>
): Promise<void> => {
  const tmpDir = createTmpDir();
  try {
    await fn(tmpDir);
  } finally {
    removeTmpDir(tmpDir);
  }
};

export { setTimeout as delay } from "node:timers/promises";
