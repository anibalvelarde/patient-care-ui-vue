// services/authBridge.ts
//
// A tiny, dependency-free indirection layer between the low-level HTTP client and the
// Pinia auth store + router. HttpClientBase needs the current access token, a way to attempt
// a silent refresh on 401, and a way to react to 401/403 — but importing the store/router
// into HttpClientBase would create an import cycle (store -> AuthHttpClient -> HttpClientBase).
// The store and main.ts register their callbacks here at startup instead.

type RefreshFn = () => Promise<boolean>;

let accessTokenGetter: () => string | null = () => null;
let refreshFn: RefreshFn | null = null;
let onUnauthorized: () => void = () => {};
let onForbidden: (code?: string) => void = () => {};

export const authBridge = {
  /** Current access token (in-memory), or null when unauthenticated. */
  getAccessToken: (): string | null => accessTokenGetter(),
  setAccessTokenGetter(fn: () => string | null): void {
    accessTokenGetter = fn;
  },

  /** Attempt a single silent refresh; resolves true if a new access token was obtained. */
  tryRefresh: (): Promise<boolean> => (refreshFn ? refreshFn() : Promise.resolve(false)),
  setRefreshFn(fn: RefreshFn): void {
    refreshFn = fn;
  },

  /** Called when a request is unauthorized and refresh failed — clears session + redirects to login. */
  notifyUnauthorized(): void {
    onUnauthorized();
  },
  setOnUnauthorized(fn: () => void): void {
    onUnauthorized = fn;
  },

  /** Called on a 403. `code` carries the ProblemDetails `code` (e.g. "password_change_required"). */
  notifyForbidden(code?: string): void {
    onForbidden(code);
  },
  setOnForbidden(fn: (code?: string) => void): void {
    onForbidden = fn;
  },
};
