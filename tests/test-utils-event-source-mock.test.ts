// @vitest-environment jsdom
import { EventSourceMock, installEventSourceMock } from "./test-utils";

// 再発防止: app-header / app-responsive で重複していた no-op EventSource 実装を
// `tests/test-utils.ts` に集約。新規テストが独自に EventSource を再実装しないよう、
// helper の契約をここで固定する。過去の architect-review
// (ARCH-NEW-tests-event-source-mock-dup) を参照。
describe("EventSourceMock", () => {
  it("EventSource interface を実装している", () => {
    const es = new EventSourceMock("/api/watch");

    expect(es.url).toBe("/api/watch");
    expect(es.readyState).toBe(0);
    expect(typeof es.addEventListener).toBe("function");
    expect(typeof es.removeEventListener).toBe("function");
    expect(typeof es.dispatchEvent).toBe("function");
    expect(typeof es.close).toBe("function");
  });

  it("URL オブジェクトを受け取った場合は文字列化する", () => {
    const es = new EventSourceMock(new URL("http://localhost/api/watch"));

    expect(es.url).toBe("http://localhost/api/watch");
  });
});

// eslint-disable-next-line eslint-plugin-jest/valid-title -- prefer-describe-function-title requires function reference
describe(installEventSourceMock, () => {
  it("globalThis.EventSource を EventSourceMock に差し替える", () => {
    const restore = installEventSourceMock();

    try {
      expect(globalThis.EventSource).toBe(EventSourceMock);
    } finally {
      restore();
    }
  });

  it("restore 関数で元の実装に戻せる", () => {
    const original = globalThis.EventSource;
    const restore = installEventSourceMock();

    restore();

    expect(globalThis.EventSource).toBe(original);
  });
});
