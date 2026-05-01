export const isExternalUrl = (src: string): boolean =>
  src.startsWith("http://") ||
  src.startsWith("https://") ||
  src.startsWith("data:");

export const resolveImageSrc = (
  src: string,
  selectedPath: string | null
): string => {
  if (isExternalUrl(src)) {
    return src;
  }
  const dir =
    selectedPath !== null && selectedPath !== ""
      ? selectedPath.replace(/[^/]+$/, "")
      : "";
  const imagePath = dir + src.replace(/^\.\//, "");
  return `/api/image?path=${encodeURIComponent(imagePath)}`;
};

export const resolvePath = (from: string, relative: string): string => {
  const dir = from.includes("/") ? from.slice(0, from.lastIndexOf("/")) : "";
  const parts = dir ? dir.split("/") : [];

  for (const segment of relative.split("/")) {
    if (segment === "..") {
      parts.pop();
    } else if (segment !== "." && segment !== "") {
      parts.push(segment);
    }
  }

  return parts.join("/");
};
