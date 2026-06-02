import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { parsePackageJson, readPackageJson } from "@server/package-info";

// 副作用のない純関数を直接検証する。`vi.doMock("node:fs")` + `cli.ts` の
// 動的 re-import を排し、CI worker 間のモジュールキャッシュ leak に依存しない
// 安定したテストにする（issue #150）。
describe(parsePackageJson, () => {
  it("version を持つ JSON をパースして返す", () => {
    expect(parsePackageJson('{ "version": "1.2.3" }')).toEqual({
      version: "1.2.3",
    });
  });

  it("version が無いとき Invalid package.json: missing version を throw する", () => {
    expect(() => parsePackageJson('{ "name": "specv" }')).toThrow(
      "Invalid package.json: missing version"
    );
  });

  it("version が文字列でないとき Invalid package.json: missing version を throw する", () => {
    expect(() => parsePackageJson('{ "version": 1 }')).toThrow(
      "Invalid package.json: missing version"
    );
  });

  it("不正 JSON のとき SyntaxError を throw する", () => {
    expect(() => parsePackageJson("{not-json")).toThrow(SyntaxError);
  });
});

// `readPackageJson` の実ファイル読み込み経路を検証する。node:fs のモックも
// 副作用モジュールの re-import も使わず、一時ディレクトリに実ファイルを書いて
// 読み込む決定的なテストにする（issue #150）。
describe(readPackageJson, () => {
  it("実ファイルから version を読み込んで返す", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "specv-pkg-"));
    const filePath = path.join(dir, "package.json");
    fs.writeFileSync(filePath, '{ "version": "9.9.9" }', "utf8");

    try {
      expect(readPackageJson(filePath)).toEqual({ version: "9.9.9" });
    } finally {
      fs.rmSync(dir, { force: true, recursive: true });
    }
  });
});
