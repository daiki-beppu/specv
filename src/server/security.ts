import fs from "node:fs";
import path from "node:path";

export function validatePath(filePath: string, baseDir: string): string {
  const decoded = decodeURIComponent(filePath);
  const resolved = path.resolve(baseDir, decoded);

  if (!resolved.startsWith(baseDir + path.sep) && resolved !== baseDir) {
    throw new Error(`Path traversal detected: ${filePath}`);
  }

  if (!resolved.endsWith(".md")) {
    throw new Error(`Only .md files are allowed: ${filePath}`);
  }

  // シンボリックリンク経由のトラバーサルを防止
  try {
    const realPath = fs.realpathSync(resolved);
    if (!realPath.startsWith(baseDir + path.sep) && realPath !== baseDir) {
      throw new Error(`Path traversal detected: ${filePath}`);
    }
    return realPath;
  } catch (err) {
    if (err instanceof Error && err.message.includes("traversal")) {
      throw err;
    }
    // ファイルが存在しない場合は resolved を返す（呼び出し側で ENOENT になる）
    return resolved;
  }
}
