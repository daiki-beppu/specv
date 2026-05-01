import type { ReactNode } from "react";

export const reactNodeToString = (value: ReactNode): string => {
  if (value === null || value === undefined || typeof value === "boolean") {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((child: ReactNode) => reactNodeToString(child)).join("");
  }
  return "";
};
