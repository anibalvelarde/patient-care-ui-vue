// services/ApiError.ts
// WP-59: an HTTP error that keeps its status. HttpClientBase throws this for every non-OK
// response, so callers can tell a 409 (e.g. a double-booking) from a 400 without matching on
// message text. It IS an Error — existing `e instanceof Error ? e.message : …` callers are unchanged.

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** True when the error is an HTTP 409 Conflict from the API. */
export function isConflict(e: unknown): e is ApiError {
  return e instanceof ApiError && e.status === 409;
}
