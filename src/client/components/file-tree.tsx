import type { FileNode } from "@shared/types";
import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FileTreeNode } from "@/components/file-tree-node";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Tree } from "@/components/ui/tree";
import { computeAutoExpandPaths, findNode } from "@/lib/auto-expand";
import { filterTree } from "@/lib/file-tree-filter";

interface FileTreeProps {
  files: FileNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

export const FileTree = ({ files, selectedPath, onSelect }: FileTreeProps) => {
  const [query, setQuery] = useState("");
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() =>
    computeAutoExpandPaths(files)
  );
  const isMount = useRef(true);

  useEffect(() => {
    if (isMount.current) {
      isMount.current = false;
      return;
    }
    setExpandedPaths(computeAutoExpandPaths(files));
  }, [files]);

  const filtered = useMemo(
    () => (query ? filterTree(files, query) : files),
    [files, query]
  );

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    []
  );

  const onExpand = useCallback(
    (dirPath: string) => {
      const node = findNode(files, dirPath);
      const subPaths =
        node?.children === undefined
          ? new Set<string>()
          : computeAutoExpandPaths(node.children);

      setExpandedPaths((prev) => {
        if (prev.has(dirPath)) {
          return prev;
        }
        const next = new Set([...prev, dirPath, ...subPaths]);
        return next;
      });
    },
    [files]
  );

  const onCollapse = useCallback((dirPath: string) => {
    setExpandedPaths((prev) => {
      if (!prev.has(dirPath)) {
        return prev;
      }
      const next = new Set<string>();
      const prefix = `${dirPath}/`;
      for (const p of prev) {
        if (p !== dirPath && !p.startsWith(prefix)) {
          next.add(p);
        }
      }
      return next;
    });
  }, []);

  return (
    <div>
      <InputGroup className="mb-3">
        <InputGroupAddon align="inline-start">
          <Search size={14} />
        </InputGroupAddon>
        <InputGroupInput
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search files..."
          className="py-1 text-sm"
        />
        <InputGroupAddon align="inline-end">
          <Kbd>⌘</Kbd>
          <Kbd>P</Kbd>
        </InputGroupAddon>
      </InputGroup>
      <Tree>
        {filtered.map((node) => (
          <FileTreeNode
            key={node.path}
            node={node}
            selectedPath={selectedPath}
            onSelect={onSelect}
            forceExpand={Boolean(query)}
            expandedPaths={expandedPaths}
            onExpand={onExpand}
            onCollapse={onCollapse}
          />
        ))}
      </Tree>
    </div>
  );
};
