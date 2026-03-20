import type { ComponentPropsWithoutRef } from "react";

import { resolveImageSrc } from "@/components/markdown/path-utils";

export const MarkdownImage = ({
  src,
  alt,
  selectedPath,
  ...props
}: ComponentPropsWithoutRef<"img"> & {
  selectedPath: string | null;
}) => {
  const resolvedSrc = src ? resolveImageSrc(src, selectedPath) : "";
  return <img src={resolvedSrc} alt={alt ?? ""} {...props} />;
};
