import { isObjectRecord } from "./is-object-record";

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

export const isFileNode = (value: unknown): value is FileNode => {
  if (!isObjectRecord(value)) {
    return false;
  }
  if (typeof value.path !== "string" || typeof value.name !== "string") {
    return false;
  }
  if (value.children === undefined) {
    return true;
  }
  if (!Array.isArray(value.children)) {
    return false;
  }
  return value.children.every(isFileNode);
};

export const isFilesResponse = (value: unknown): value is FilesResponse => {
  if (!isObjectRecord(value)) {
    return false;
  }
  if (!Array.isArray(value.files)) {
    return false;
  }
  return value.files.every(isFileNode);
};

export const isFileChangedPayload = (
  value: unknown
): value is FileChangedPayload =>
  isObjectRecord(value) && typeof value.path === "string";

export const isTreeChangedPayload = (
  value: unknown
): value is TreeChangedPayload => {
  if (!isObjectRecord(value)) {
    return false;
  }
  if (!Array.isArray(value.files)) {
    return false;
  }
  return value.files.every(isFileNode);
};
