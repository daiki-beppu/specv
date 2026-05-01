import type { ApiErrorResponse } from "@shared/errors";
import type { FilesResponse } from "@shared/types";

import { expectApiErrorResponse, expectFilesResponse } from "../test-utils";

// 再発防止: api テストの asserts ヘルパーが `FilesResponse` / `ApiErrorResponse`
// を文字列レベルで再宣言しないこと、および各テストファイルで再実装されないことを保証する。
// SSOT は `@shared/{types,errors}.ts`、共有実装は `tests/test-utils.ts`。
// 過去の architect-review (ARCH-NEW-tests-api-asserts-shape-rehardcoded /
// ARCH-NEW-tests-api-asserts-helper-dup) を参照。

describe("api asserts ヘルパー契約", () => {
  it("FilesResponse 型に narrow される", () => {
    const json: unknown = { files: [{ name: "a.md", path: "a.md" }] };

    expectFilesResponse(json);

    // narrow 成功時に SSOT 型 (FilesResponse) のフィールドにアクセスできる
    const filesResponse: FilesResponse = json;
    expect(filesResponse.files[0]?.name).toBe("a.md");
  });

  it("ApiErrorResponse 型に narrow され、AppErrorCode 拡張に自動追従できる", () => {
    const json: unknown = { code: "SECURITY", error: "boom" };

    expectApiErrorResponse(json);

    // narrow 成功時に SSOT 型 (ApiErrorResponse) のフィールドにアクセスできる
    const apiError: ApiErrorResponse = json;
    expect(apiError.error).toBe("boom");
    expect(apiError.code).toBe("SECURITY");
  });

  it("不正な shape は assert で失敗する", () => {
    const json: unknown = { files: "not-an-array" };

    expect(() => {
      expectFilesResponse(json);
    }).toThrow(/expected.*to be true/i);
  });
});
