import type { FileNode } from "../shared/types.js";

export async function fetchFiles(): Promise<FileNode[]> {
  const res = await fetch("/api/files");
  if (!res.ok) throw new Error("Failed to fetch file list");
  const data = await res.json();
  return data.files;
}

export async function fetchFile(path: string): Promise<string> {
  const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(`Failed to fetch: ${path}`);
  return res.text();
}
