import type { FilesResponse } from "@shared/types";

import { fetchFile, fetchFiles } from "@/api";

afterEach(() => {
  vi.restoreAllMocks();
});

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(fetchFiles, () => {
  it("/api/files が 200 + { files } を返したとき FileNode 配列を返す", async () => {
    const files = [
      { name: "README.md", path: "README.md" },
      { name: "guide.md", path: "docs/guide.md" },
    ];
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ files }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    );

    const result = await fetchFiles();

    expect(result).toEqual(files);
    expect(spy).toHaveBeenCalledWith("/api/files");
    expectTypeOf<Awaited<ReturnType<typeof fetchFiles>>>().toEqualTypeOf<
      FilesResponse["files"]
    >();
  });

  it("ネットワークエラーで TypeError が呼び出し元へ伝播する", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new TypeError("Failed to fetch")
    );

    await expect(fetchFiles()).rejects.toThrow(TypeError);
  });

  it('5xx 応答で Error("Failed to fetch file list") を throw する', async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 500 })
    );

    await expect(fetchFiles()).rejects.toThrow("Failed to fetch file list");
  });

  it("サーバー由来の error メッセージを Error.message に伝播する", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Failed to scan files" }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      })
    );

    await expect(fetchFiles()).rejects.toThrow("Failed to scan files");
  });

  it("error フィールドが欠落した JSON ではフォールバック文字列で throw する", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ files: [] }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      })
    );

    await expect(fetchFiles()).rejects.toThrow("Failed to fetch file list");
  });
});

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(fetchFile, () => {
  it("/api/file?path=<encoded> が 200 + text を返したとき本文文字列を返す", async () => {
    const targetPath = "README.md";
    const body = "# Hello\n";
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(body, { status: 200 }));

    const result = await fetchFile(targetPath);

    expect(result).toBe(body);
    expect(spy).toHaveBeenCalledWith(
      `/api/file?path=${encodeURIComponent(targetPath)}`
    );
  });

  it("スペースを含むパスでも encodeURIComponent 済みクエリで URL に乗る", async () => {
    const targetPath = "docs/foo bar.md";
    const body = "# spaced\n";
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(body, { status: 200 }));

    const result = await fetchFile(targetPath);

    expect(result).toBe(body);
    expect(spy).toHaveBeenCalledWith(
      `/api/file?path=${encodeURIComponent(targetPath)}`
    );
  });

  it("ネットワークエラーで TypeError が呼び出し元へ伝播する", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new TypeError("Failed to fetch")
    );

    await expect(fetchFile("README.md")).rejects.toThrow(TypeError);
  });

  it("5xx 応答で Error(`Failed to fetch: ${path}`) を throw する", async () => {
    const targetPath = "missing.md";
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 500 })
    );

    await expect(fetchFile(targetPath)).rejects.toThrow(
      `Failed to fetch: ${targetPath}`
    );
  });

  it("サーバー由来の error メッセージを Error.message に伝播する", async () => {
    const targetPath = "../etc/passwd";
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          code: "SECURITY",
          error: "Path traversal detected: ../etc/passwd",
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 400,
        }
      )
    );

    await expect(fetchFile(targetPath)).rejects.toThrow(
      "Path traversal detected: ../etc/passwd"
    );
  });

  it("error フィールドが欠落した JSON ではフォールバック文字列で throw する", async () => {
    const targetPath = "missing.md";
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ unrelated: "value" }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      })
    );

    await expect(fetchFile(targetPath)).rejects.toThrow(
      `Failed to fetch: ${targetPath}`
    );
  });
});
