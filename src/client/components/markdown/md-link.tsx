import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { useCallback } from "react";

import { resolvePath } from "@/components/markdown/path-utils";

export const MdLink = ({
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
      if (selectedPath && href) {
        onNavigate(resolvePath(selectedPath, href));
      }
    },
    [selectedPath, href, onNavigate]
  );

  if (href?.endsWith(".md") && selectedPath) {
    return (
      <a {...props} href={href} onClick={handleClick}>
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
