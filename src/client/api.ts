import type { ApiError, FileNode, FilesResponse } from "@shared/types";

export class FetchError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "FetchError";
  }
}

const extractErrorMessage = async (
  res: Response,
  fallback: string
): Promise<string> => {
  try {
    const body: ApiError = await res.json();
    return body.error;
  } catch {
    return fallback;
  }
};

export const fetchFiles = async (): Promise<FileNode[]> => {
  const res = await fetch("/api/files");
  if (!res.ok) {
    const message = await extractErrorMessage(res, "Failed to fetch file list");
    throw new FetchError(res.status, message);
  }
  const data: FilesResponse = await res.json();
  return data.files;
};

export const fetchFile = async (path: string): Promise<string> => {
  const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
  if (!res.ok) {
    const message = await extractErrorMessage(res, "Failed to fetch file");
    throw new FetchError(res.status, message);
  }
  return res.text();
};
