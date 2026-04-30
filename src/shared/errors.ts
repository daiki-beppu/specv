export type AppErrorCode = "SECURITY";

export abstract class AppError extends Error {
  abstract readonly code: AppErrorCode;
}

export interface ApiErrorResponse {
  error: string;
  code?: AppErrorCode;
}
