import type { Root, Table, TableCell, TableRow, Text } from "mdast";
import type { Plugin } from "unified";
import { parse } from "yaml";

const text = (value: string): Text => ({
  type: "text",
  value,
});

const cell = (value: string): TableCell => ({
  children: [text(value)],
  type: "tableCell",
});

const row = (cells: TableCell[]): TableRow => ({
  children: cells,
  type: "tableRow",
});

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
};

export const remarkFrontmatterTable: Plugin<[], Root> = () => (tree) => {
  const [firstNode] = tree.children;
  if (!firstNode || firstNode.type !== "yaml") {
    return;
  }

  let parsed: unknown;
  try {
    parsed = parse(firstNode.value);
  } catch {
    // Invalid YAML
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    tree.children.splice(0, 1);
    return;
  }

  const entries = Object.entries(parsed as Record<string, unknown>);
  if (entries.length === 0) {
    tree.children.splice(0, 1);
    return;
  }

  const headerRow = row([cell("Key"), cell("Value")]);
  const dataRows = entries.map(([key, val]) =>
    row([cell(key), cell(formatValue(val))])
  );

  const table: Table = {
    align: [null, null],
    children: [headerRow, ...dataRows],
    type: "table",
  };

  tree.children[0] = table;
};
