import { findUnpairedSourceFiles } from "../scripts/check-test-pair";

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(findUnpairedSourceFiles, () => {
  it("src/ 配下の実装ファイルのみが含まれテストファイルが0件のとき、その実装ファイル一覧を返す", () => {
    // Arrange
    const files = ["src/server/files.ts"];

    // Act
    const result = findUnpairedSourceFiles(files);

    // Assert
    expect(result).toEqual(["src/server/files.ts"]);
  });

  it("実装ファイルと .test.ts が同時に含まれるとき、空配列を返す", () => {
    // Arrange
    const files = ["src/server/files.ts", "tests/files.test.ts"];

    // Act
    const result = findUnpairedSourceFiles(files);

    // Assert
    expect(result).toEqual([]);
  });

  it("実装ファイルと .test.tsx が同時に含まれるとき、空配列を返す", () => {
    // Arrange
    const files = [
      "src/client/components/source.tsx",
      "tests/components/source.test.tsx",
    ];

    // Act
    const result = findUnpairedSourceFiles(files);

    // Assert
    expect(result).toEqual([]);
  });

  it("実装ファイルと e2e/ 配下のテストが同時に含まれるとき、空配列を返す", () => {
    // Arrange
    const files = ["src/server/api.ts", "e2e/navigation.test.ts"];

    // Act
    const result = findUnpairedSourceFiles(files);

    // Assert
    expect(result).toEqual([]);
  });

  it("入力が空配列のとき、空配列を返す", () => {
    // Arrange
    const files: string[] = [];

    // Act
    const result = findUnpairedSourceFiles(files);

    // Assert
    expect(result).toEqual([]);
  });

  it("テストファイルのみで実装ファイルが0件のとき、空配列を返す", () => {
    // Arrange
    const files = ["tests/files.test.ts"];

    // Act
    const result = findUnpairedSourceFiles(files);

    // Assert
    expect(result).toEqual([]);
  });

  it("対象外ファイル（設定・ドキュメント）のみのとき、空配列を返す", () => {
    // Arrange
    const files = ["README.md", "vite.config.ts", "package.json"];

    // Act
    const result = findUnpairedSourceFiles(files);

    // Assert
    expect(result).toEqual([]);
  });

  it("複数の実装ファイル変更がありテストファイルが0件のとき、全実装ファイル一覧を返す", () => {
    // Arrange
    const files = ["src/a.ts", "src/b.tsx", "src/c.ts"];

    // Act
    const result = findUnpairedSourceFiles(files);

    // Assert
    expect(result).toEqual(["src/a.ts", "src/b.tsx", "src/c.ts"]);
  });

  it("src/ 配下の .test.ts は実装ファイル扱いされず警告対象から除外される", () => {
    // Arrange
    const files = ["src/server/files.test.ts"];

    // Act
    const result = findUnpairedSourceFiles(files);

    // Assert
    expect(result).toEqual([]);
  });

  it("src/ 配下の .tsx 実装ファイルも検出対象になる", () => {
    // Arrange
    const files = ["src/client/app.tsx"];

    // Act
    const result = findUnpairedSourceFiles(files);

    // Assert
    expect(result).toEqual(["src/client/app.tsx"]);
  });

  it("e2e/ 配下の .test.ts でない .ts ファイル（ヘルパー等）もテストファイルとして扱われる", () => {
    // Arrange
    const files = ["src/server/api.ts", "e2e/helpers.ts"];

    // Act
    const result = findUnpairedSourceFiles(files);

    // Assert
    expect(result).toEqual([]);
  });

  it("入力配列の順序が異なっても結果は変わらない", () => {
    // Arrange
    const files = ["tests/files.test.ts", "src/server/files.ts"];

    // Act
    const result = findUnpairedSourceFiles(files);

    // Assert
    expect(result).toEqual([]);
  });

  it("同一コミットに複数の実装ファイルとテストファイルが混在するとき、空配列を返す", () => {
    // Arrange
    const files = ["src/a.ts", "src/b.tsx", "tests/a.test.ts"];

    // Act
    const result = findUnpairedSourceFiles(files);

    // Assert
    expect(result).toEqual([]);
  });

  it("src/ 配下でも .ts/.tsx 以外の拡張子（.json 等）は実装ファイル扱いしない", () => {
    // Arrange
    const files = ["src/server/config.json"];

    // Act
    const result = findUnpairedSourceFiles(files);

    // Assert
    expect(result).toEqual([]);
  });

  it("src/ 外の .ts ファイル（scripts/ 等）は実装ファイル扱いしない", () => {
    // Arrange
    const files = ["scripts/check-test-pair.ts"];

    // Act
    const result = findUnpairedSourceFiles(files);

    // Assert
    expect(result).toEqual([]);
  });

  it("src/ を部分文字列に含むだけの別ディレクトリ（例: subscription/...）は実装ファイル扱いしない", () => {
    // Arrange
    const files = ["subscription/foo.ts"];

    // Act
    const result = findUnpairedSourceFiles(files);

    // Assert
    expect(result).toEqual([]);
  });

  it("末尾が .d.ts の型定義ファイルは仕様通り実装ファイルとして警告される（例外検出はスコープ外）", () => {
    // Arrange
    const files = ["src/shared/types.d.ts"];

    // Act
    const result = findUnpairedSourceFiles(files);

    // Assert
    expect(result).toEqual(["src/shared/types.d.ts"]);
  });
});
