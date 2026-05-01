import type { FileNode } from "@shared/types";

export const filterTree = (nodes: FileNode[], query: string): FileNode[] => {
  const lower = query.toLowerCase();
  const result: FileNode[] = [];
  for (const node of nodes) {
    if (node.children !== undefined) {
      const filtered = filterTree(node.children, query);
      if (filtered.length > 0) {
        result.push({ ...node, children: filtered });
      }
    } else if (
      node.name.toLowerCase().includes(lower) ||
      node.path.toLowerCase().includes(lower)
    ) {
      result.push(node);
    }
  }
  return result;
};
