import fs from "node:fs";
import path from "node:path";

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SecurityError";
  }
}

const isWithinBaseDir = (targetPath: string, baseDir: string): boolean =>
  targetPath.startsWith(baseDir + path.sep) || targetPath === baseDir;

const validateExtension = (filePath: string): void => {
  if (!filePath.endsWith(".md")) {
    throw new SecurityError(`Only .md files are allowed: ${filePath}`);
  }
};

const resolveRealPath = (
  resolved: string,
  baseDir: string,
  filePath: string
): string => {
  try {
    const realPath = fs.realpathSync(resolved);
    if (!isWithinBaseDir(realPath, baseDir)) {
      throw new SecurityError(`Path traversal detected: ${filePath}`);
    }
    return realPath;
  } catch (error) {
    if (error instanceof SecurityError) {
      throw error;
    }
    return resolved;
  }
};

export const validatePath = (filePath: string, baseDir: string): string => {
  const decoded = decodeURIComponent(filePath);
  const resolved = path.resolve(baseDir, decoded);

  if (!isWithinBaseDir(resolved, baseDir)) {
    throw new SecurityError(`Path traversal detected: ${filePath}`);
  }

  validateExtension(decoded);

  return resolveRealPath(resolved, baseDir, filePath);
};
