import type { ComponentPropsWithoutRef } from "react";

import { resolveImageSrc } from "@/lib/path-utils";

export const MarkdownImage = ({
  src,
  alt,
  selectedPath,
  ...props
}: ComponentPropsWithoutRef<"img"> & {
  selectedPath: string | null;
}) => {
  const resolvedSrc =
    src !== undefined && src !== "" ? resolveImageSrc(src, selectedPath) : "";
  return <img src={resolvedSrc} alt={alt ?? ""} {...props} />;
};
