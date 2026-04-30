import type { ApiErrorResponse } from "@shared/errors";
import type { FileNode, FilesResponse } from "@shared/types";

const parseApiError = async (
  res: Response,
  fallback: string
): Promise<string> => {
  try {
    const body = (await res.json()) as ApiErrorResponse;
    if (typeof body.error === "string") {
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
  const data = (await res.json()) as FilesResponse;
  return data.files;
};

export const fetchFile = async (path: string): Promise<string> => {
  const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
  if (!res.ok) {
    throw new Error(await parseApiError(res, `Failed to fetch: ${path}`));
  }
  return res.text();
};
