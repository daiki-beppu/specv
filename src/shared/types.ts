export interface FileNode {
  path: string;
  name: string;
  children?: FileNode[];
}

export interface FilesResponse {
  files: FileNode[];
}

export interface FileChangedPayload {
  path: string;
}

export interface TreeChangedPayload {
  files: FileNode[];
}

export type WatchEventName = "file-changed" | "tree-changed";
