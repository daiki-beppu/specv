// 型ガード共有 helper（SSOT）。
// `as Record<string, unknown>` による narrow を避けて
// `typescript/no-unsafe-type-assertion` を 0 件に保つ目的で、
// `@shared` 配下のスキーマ narrow / `client` `server` の入口チェックを
// すべてここに集約する。新規に object narrow が必要になった場合は
// 別実装を作らずこのモジュールを import すること。
export const isObjectRecord = (
  value: unknown
): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
