export interface FileNode {
  path: string;
  name: string;
  children?: FileNode[];
}
