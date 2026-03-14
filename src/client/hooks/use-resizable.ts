import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_WIDTH = 256;
const MAX_WIDTH = 480;
const MIN_WIDTH = 160;

export const useResizable = (
  sidebarRef: React.RefObject<HTMLElement | null>
) => {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const rafRef = useRef<number>(0);
  const offsetLeftRef = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.detail > 1) {
        return;
      }
      e.preventDefault();
      offsetLeftRef.current =
        sidebarRef.current?.getBoundingClientRect().left ?? 0;
      setIsDragging(true);
    },
    [sidebarRef]
  );

  const onDoubleClick = useCallback(() => {
    setWidth(DEFAULT_WIDTH);
  }, []);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const clamped = Math.min(
          MAX_WIDTH,
          Math.max(MIN_WIDTH, e.clientX - offsetLeftRef.current)
        );
        setWidth((prev) => (prev === clamped ? prev : clamped));
      });
    };

    const handleMouseUp = () => {
      cancelAnimationFrame(rafRef.current);
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, sidebarRef]);

  return { isDragging, onDoubleClick, onMouseDown, width };
};
