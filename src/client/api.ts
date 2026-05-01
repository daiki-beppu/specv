import { isApiErrorResponse } from "@shared/errors";
import { isFilesResponse } from "@shared/types";
import type { FileNode } from "@shared/types";

const parseApiError = async (
  res: Response,
  fallback: string
): Promise<string> => {
  try {
    const body: unknown = await res.json();
    if (isApiErrorResponse(body)) {
      return body.error;
    }
    return fallback;
  } catch {
    // 非 JSON / 空ボディはフォールバックに倒す
    return fallback;
  }
};

export const fetchFiles = async (): Promise<FileNode[]> => {
  const res = await fetch("/api/files");
  if (!res.ok) {
    throw new Error(await parseApiError(res, "Failed to fetch file list"));
  }
  const data: unknown = await res.json();
  if (!isFilesResponse(data)) {
    throw new Error("Invalid /api/files response shape");
  }
  return data.files;
};

export const fetchFile = async (path: string): Promise<string> => {
  const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
  if (!res.ok) {
    throw new Error(await parseApiError(res, `Failed to fetch: ${path}`));
  }
  return res.text();
};
