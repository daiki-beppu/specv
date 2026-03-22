// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import { FetchError, fetchFile, fetchFiles } from "@/api";

const mockFetch = (status: number, body: unknown) => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
      text: () =>
        Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
    })
  );
};

const mockFetchJsonFail = (status: number) => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: () => Promise.reject(new Error("invalid json")),
      text: () => Promise.resolve("Not Found"),
    })
  );
};

describe("FetchError", () => {
  it("status と message を保持する", () => {
    const error = new FetchError(404, "File not found");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("FetchError");
    expect(error.status).toBe(404);
    expect(error.message).toBe("File not found");
  });
});

describe("fetchFiles", () => {
  it("成功時にファイル一覧を返す", async () => {
    const files = [{ path: "readme.md", name: "readme.md" }];
    mockFetch(200, { files });

    const result = await fetchFiles();
    expect(result).toEqual(files);
  });

  it("サーバーエラー時に FetchError を throw する", async () => {
    mockFetch(500, { error: "Failed to scan files" });

    await expect(fetchFiles()).rejects.toThrow(FetchError);
    await expect(fetchFiles()).rejects.toMatchObject({
      status: 500,
      message: "Failed to scan files",
    });
  });

  it("エラーレスポンスが JSON 解析不能な場合にフォールバックメッセージを使う", async () => {
    mockFetchJsonFail(500);

    await expect(fetchFiles()).rejects.toMatchObject({
      status: 500,
      message: "Failed to fetch file list",
    });
  });
});

describe("fetchFile", () => {
  it("成功時にファイル内容を返す", async () => {
    mockFetch(200, "# Hello");

    const result = await fetchFile("readme.md");
    expect(result).toBe("# Hello");
  });

  it("サーバーエラー時に FetchError を throw する", async () => {
    mockFetch(404, { error: "File not found" });

    await expect(fetchFile("missing.md")).rejects.toThrow(FetchError);
    await expect(fetchFile("missing.md")).rejects.toMatchObject({
      status: 404,
      message: "File not found",
    });
  });

  it("エラーレスポンスが JSON 解析不能な場合にフォールバックメッセージを使う", async () => {
    mockFetchJsonFail(404);

    await expect(fetchFile("missing.md")).rejects.toMatchObject({
      status: 404,
      message: "Failed to fetch file",
    });
  });
});
