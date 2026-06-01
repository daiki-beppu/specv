import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { ApiErrorResponse } from "@shared/errors";
import { isApiErrorResponse } from "@shared/errors";
import type { FilesResponse } from "@shared/types";
import { isFilesResponse } from "@shared/types";

export const createTmpDir = () =>
  fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "specv-test-")));

export const removeTmpDir = (dir: string) => {
  fs.rmSync(dir, { recursive: true });
};

export const createFile = (
  tmpDir: string,
  relativePath: string,
  content: string | Buffer = ""
) => {
  const fullPath = path.join(tmpDir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
};

export const withTmpDir = async (
  fn: (tmpDir: string) => Promise<void>
): Promise<void> => {
  const tmpDir = createTmpDir();
  try {
    await fn(tmpDir);
  } finally {
    removeTmpDir(tmpDir);
  }
};

export { setTimeout as delay } from "node:timers/promises";

// API レスポンスを SSOT 型 (`@shared/{types,errors}.ts`) に narrow する asserts ヘルパー。
// 各テストファイルで `asserts value is FilesResponse` / `asserts value is ApiErrorResponse`
// の戻り型を文字列レベルで再宣言しないよう、共有ヘルパーとして集約する。
// 過去の architect-review (ARCH-NEW-tests-api-asserts-helper-dup /
// ARCH-NEW-tests-api-asserts-shape-rehardcoded) を参照。
export function expectFilesResponse(
  value: unknown
): asserts value is FilesResponse {
  expect(isFilesResponse(value)).toBe(true);
}

export function expectApiErrorResponse(
  value: unknown
): asserts value is ApiErrorResponse {
  expect(isApiErrorResponse(value)).toBe(true);
}

// jsdom 環境向けの `EventSource` モック。
// `useWatch` / `useServerStatus` が `new EventSource(...)` する経路を支える。
// 生成された instance を `static instances` で追跡し、`dispatch(type)` で
// `addEventListener` 登録済みリスナーを発火できる（open/error 等の検証用）。
// production (`src/client/hooks/use-server-status.ts`) は `addEventListener`
// 経路のみ使うため、`onopen`/`onerror` field 経由の発火はサポートしない。
// payload 付き event を扱う variant は `tests/client/hooks/use-watch.test.ts`
// の `MockEventSource`（dispatch/dispatchRaw 付き）を使う。
export class EventSourceMock implements EventSource {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;
  static instances: EventSourceMock[] = [];
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSED = 2;
  readonly url: string;
  readonly withCredentials = false;
  readonly readyState = 0;
  onerror: ((this: EventSource, ev: Event) => unknown) | null = null;
  onmessage: ((this: EventSource, ev: MessageEvent) => unknown) | null = null;
  onopen: ((this: EventSource, ev: Event) => unknown) | null = null;
  close = vi.fn();
  private readonly listeners = new Map<
    string,
    EventListenerOrEventListenerObject[]
  >();

  constructor(url: string | URL, _eventSourceInitDict?: EventSourceInit) {
    this.url = typeof url === "string" ? url : url.toString();
    EventSourceMock.instances.push(this);
  }

  addEventListener<K extends keyof EventSourceEventMap>(
    type: K,
    listener: (this: EventSource, ev: EventSourceEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void {
    const arr = this.listeners.get(type) ?? [];
    arr.push(listener);
    this.listeners.set(type, arr);
  }

  // eslint-disable-next-line class-methods-use-this, no-empty-function
  removeEventListener() {}

  // eslint-disable-next-line class-methods-use-this
  dispatchEvent(_event: Event): boolean {
    return false;
  }

  dispatch(type: string) {
    const event = new Event(type);
    for (const listener of this.listeners.get(type) ?? []) {
      if (typeof listener === "function") {
        listener(event);
      } else {
        listener.handleEvent(event);
      }
    }
  }

  static get last(): EventSourceMock {
    const inst = EventSourceMock.instances.at(-1);
    if (!inst) {
      throw new Error("EventSourceMock has not been instantiated");
    }
    return inst;
  }

  static find(url: string): EventSourceMock | undefined {
    return EventSourceMock.instances.find((i) => i.url === url);
  }

  static reset() {
    EventSourceMock.instances = [];
  }
}

// `globalThis.EventSource` を no-op `EventSourceMock` に差し替え、
// 元の実装を復元するクリーンアップ関数を返す。
// jsdom 環境では `EventSource` が `globalThis` に定義済みのため、
// 復元はそのまま再代入すれば足りる。
export const installEventSourceMock = (): (() => void) => {
  const original = globalThis.EventSource;
  globalThis.EventSource = EventSourceMock;
  return () => {
    globalThis.EventSource = original;
  };
};
