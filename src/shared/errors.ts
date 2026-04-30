import { isObjectRecord } from "./is-object-record";

export type AppErrorCode = "SECURITY";

const APP_ERROR_CODE_VALUES: ReadonlySet<string> = new Set<string>([
  "SECURITY",
]);

export abstract class AppError extends Error {
  abstract readonly code: AppErrorCode;
}

export interface ApiErrorResponse {
  error: string;
  code?: AppErrorCode;
}

const isAppErrorCode = (value: unknown): value is AppErrorCode =>
  typeof value === "string" && APP_ERROR_CODE_VALUES.has(value);

export const isApiErrorResponse = (
  value: unknown
): value is ApiErrorResponse => {
  if (!isObjectRecord(value)) {
    return false;
  }
  if (typeof value.error !== "string") {
    return false;
  }
  if (value.code === undefined) {
    return true;
  }
  return isAppErrorCode(value.code);
};
