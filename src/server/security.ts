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

  return resolved;
}
