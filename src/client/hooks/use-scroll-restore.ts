import type React from "react";
import { useEffect, useRef } from "react";

export const useScrollRestore = (
  scrollRef: React.RefObject<HTMLDivElement | null>,
  selectedPath: string | null
): void => {
  const prevPathRef = useRef(selectedPath);

  useEffect(() => {
    if (prevPathRef.current !== selectedPath && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    prevPathRef.current = selectedPath;
  }, [selectedPath, scrollRef]);
};
