export interface FileNode {
  path: string;
  name: string;
  children?: FileNode[];
}

// API レスポンス
export interface ApiError {
  error: string;
}

export interface FilesResponse {
  files: FileNode[];
}

// SSE イベントペイロード
export interface FileChangedEvent {
  path: string;
}

export interface TreeChangedEvent {
  files: FileNode[];
}
