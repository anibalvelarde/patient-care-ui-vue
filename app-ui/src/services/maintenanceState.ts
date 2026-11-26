// services/maintenanceState.ts
//
// WP-51 (maintenance mode / "shut-off valve"): the shared, dependency-free state behind the
// valve. `useMaintenanceMode` (mounted once in App.vue) polls /maintenance.json and writes here;
// App.vue reads it to show the lockout / banner; HttpClientBase reads it to refuse writes. Kept
// out of Pinia so HttpClientBase can import it without an import cycle (same reason as
// authBridge). The SYSADMIN bypass is registered from main.ts, where the auth store exists.

import { ref } from 'vue';

export const MAINTENANCE_MESSAGE_MAX = 300;

export interface MaintenanceStatus {
  enabled: boolean;
  message: string;
  since: string | null;
}

export const OFF: MaintenanceStatus = Object.freeze({ enabled: false, message: '', since: null });

/** Current valve state. Fails open: anything other than a well-formed `enabled: true` is OFF. */
export const maintenance = ref<MaintenanceStatus>({ ...OFF });

let bypassGetter: () => boolean = () => false;

export const maintenanceGate = {
  /** True when the current user may keep working while the valve is on (SYSADMIN). */
  isBypassed: (): boolean => bypassGetter(),
  setBypassGetter(fn: () => boolean): void {
    bypassGetter = fn;
  },
  /** True when writes must be refused for the current user. */
  blocksWrites: (): boolean => maintenance.value.enabled && !bypassGetter(),
};

/**
 * Parse a /maintenance.json body. A missing file comes back from CloudFront / nginx as the SPA's
 * index.html (HTTP 200), so the body is parsed defensively: only `{"enabled": true}` (a real
 * boolean) turns the valve on; everything else — HTML, garbage, `"true"`, `1` — is OFF.
 */
export function parseMaintenance(text: string): MaintenanceStatus {
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { ...OFF };
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ...OFF };
  const b = body as Record<string, unknown>;
  if (b.enabled !== true) return { ...OFF };
  const message = typeof b.message === 'string' ? b.message.trim().slice(0, MAINTENANCE_MESSAGE_MAX) : '';
  const since = typeof b.since === 'string' && b.since !== '' ? b.since : null;
  return { enabled: true, message, since };
}
