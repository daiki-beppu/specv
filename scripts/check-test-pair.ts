#!/usr/bin/env node
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SOURCE_PREFIX = "src/";
const E2E_PREFIX = "e2e/";
const SOURCE_EXTENSIONS = [".ts", ".tsx"] as const;
const TEST_EXTENSIONS = [".test.ts", ".test.tsx"] as const;

const endsWithAny = (file: string, suffixes: readonly string[]): boolean =>
  suffixes.some((suffix) => file.endsWith(suffix));

const isSourceFile = (file: string): boolean => {
  if (!file.startsWith(SOURCE_PREFIX)) return false;
  if (endsWithAny(file, TEST_EXTENSIONS)) return false;
  return endsWithAny(file, SOURCE_EXTENSIONS);
};

const isTestFile = (file: string): boolean => {
  if (endsWithAny(file, TEST_EXTENSIONS)) return true;
  return file.startsWith(E2E_PREFIX);
};

export const findUnpairedSourceFiles = (files: string[]): string[] => {
  const sourceFiles = files.filter(isSourceFile);
  if (sourceFiles.length === 0) return [];
  const hasTestFiles = files.some(isTestFile);
  if (hasTestFiles) return [];
  return sourceFiles;
};

const formatWarning = (files: string[]): string => {
  const list = files.map((file) => `  - ${file}`).join("\n");
  return [
    "[test-pair-check] 警告: 以下の実装ファイルにテストの変更が伴っていません:",
    list,
    "テストの追加・更新を検討してください（warning-only。コミットはブロックされません）。",
  ].join("\n");
};

const getStagedFiles = (): string[] => {
  try {
    const output = execSync(
      "git diff --cached --name-only --diff-filter=ACMR",
      { encoding: "utf8" }
    );
    return output.split("\n").filter((line) => line.length > 0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(
      `[test-pair-check] git diff の取得に失敗しました: ${message}\n`
    );
    return [];
  }
};

const main = (): void => {
  const cliArgs = process.argv.slice(2);
  const files = cliArgs.length > 0 ? cliArgs : getStagedFiles();
  const unpaired = findUnpairedSourceFiles(files);
  if (unpaired.length > 0) {
    process.stderr.write(`${formatWarning(unpaired)}\n`);
  }
  process.exit(0);
};

const entryPath = process.argv[1];
if (entryPath && fileURLToPath(import.meta.url) === entryPath) {
  main();
}
