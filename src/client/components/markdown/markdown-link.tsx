import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { useCallback } from "react";

import { resolvePath } from "@/lib/path-utils";

export const MarkdownLink = ({
  href,
  children,
  selectedPath,
  onNavigate,
  ...props
}: ComponentPropsWithoutRef<"a"> & {
  selectedPath: string | null;
  onNavigate: (path: string) => void;
}) => {
  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      if (selectedPath !== null && href !== undefined) {
        onNavigate(resolvePath(selectedPath, href));
      }
    },
    [selectedPath, href, onNavigate]
  );

  if (href?.endsWith(".md") === true && selectedPath !== null) {
    return (
      <a {...props} href={href} onClick={handleClick}>
        {children}
      </a>
    );
  }
  // hash-only anchor (rehypeAutolinkHeadings が prepend する見出し anchor を含む) は
  // 同一タブで URL hash を更新したいので target="_blank" を付与しない。
  if (href?.startsWith("#") === true) {
    return (
      <a {...props} href={href}>
        {children}
      </a>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
};
