import type { FileNode } from "@shared/types.js";

export const computeAutoExpandPaths = (nodes: FileNode[]): Set<string> => {
  const paths = new Set<string>();

  const walk = (children: FileNode[]) => {
    const dirs = children.filter((n) => n.children);
    if (dirs.length !== 1) {
      return;
    }
    paths.add(dirs[0].path);
    if (dirs[0].children) {
      walk(dirs[0].children);
    }
  };

  walk(nodes);
  return paths;
};

export const findNode = (
  nodes: FileNode[],
  path: string
): FileNode | undefined => {
  for (const node of nodes) {
    if (node.path === path) {
      return node;
    }
    if (node.children) {
      const found = findNode(node.children, path);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
};
