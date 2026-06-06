// utils/jwt.ts
// Minimal, dependency-free JWT payload decoding. This does NOT verify the signature — the API
// is the only trust boundary. We decode purely to read non-sensitive hints client-side (e.g. the
// access-token expiry, so we can refresh proactively). Authoritative identity/claims come from
// GET /api/auth/me, never from trusting the raw token.

export interface JwtPayload {
  exp?: number;
  [key: string]: unknown;
}

/** Decode the payload segment of a JWT. Returns null on any malformed input. */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** Access-token expiry as epoch milliseconds, or null if unknown. */
export function getTokenExpiryMs(token: string): number | null {
  const payload = decodeJwtPayload(token);
  return payload?.exp ? payload.exp * 1000 : null;
}
