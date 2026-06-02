import fs from "node:fs";

import { isObjectRecord } from "@shared/is-object-record";

interface PackageInfo {
  version: string;
}

const isPackageInfo = (value: unknown): value is PackageInfo =>
  isObjectRecord(value) && typeof value.version === "string";

// 副作用のない純関数として切り出すことで、`vi.doMock("node:fs")` +
// `cli.ts` の動的 re-import に依存せずに検証できる（CI worker 間の
// モジュールキャッシュ leak による flake を根本回避する。issue #150）。
export const parsePackageJson = (raw: string): PackageInfo => {
  const parsed: unknown = JSON.parse(raw);
  if (!isPackageInfo(parsed)) {
    throw new Error("Invalid package.json: missing version");
  }
  return parsed;
};

export const readPackageJson = (filePath: string): PackageInfo =>
  parsePackageJson(fs.readFileSync(filePath, "utf8"));
