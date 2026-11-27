// composables/useMaintenanceMode.ts
//
// WP-51 (maintenance mode / "shut-off valve"): during a database restore, anything the front desk
// enters after the last backup is thrown away, so the owner needs to stop data entry — while the
// API and the DB may both be down. The flag therefore lives at the edge: a never-cached
// /maintenance.json next to the SPA (S3/CloudFront; K3s nginx proxies the same CloudFront file),
// flipped by the "Maintenance mode" GitHub Action. Never via the API.
//
// We check on mount, every minute, and when the tab comes back into view. FAIL OPEN: a missing
// file, a network error or a non-JSON body all mean OFF, so a CDN hiccup can never lock the
// clinic out. Turning the valve off unlocks open tabs at the next check, no reload needed.
// Disabled in dev builds unless VITE_MAINTENANCE_CHECK_INTERVAL_MS is set (local testing).

import { onBeforeUnmount, onMounted } from 'vue';
import { maintenance, parseMaintenance, OFF } from '../services/maintenanceState';

export const MAINTENANCE_CHECK_INTERVAL_MS = 60 * 1000;
const ENV_INTERVAL_MS = Number(import.meta.env.VITE_MAINTENANCE_CHECK_INTERVAL_MS) || 0;

export interface MaintenanceCheckOptions {
  enabled?: boolean;
  intervalMs?: number;
  url?: string;
}

export function useMaintenanceMode(opts: MaintenanceCheckOptions = {}) {
  const enabled = opts.enabled ?? (__APP_VERSION__ !== 'dev' || ENV_INTERVAL_MS > 0);
  const intervalMs = opts.intervalMs ?? (ENV_INTERVAL_MS || MAINTENANCE_CHECK_INTERVAL_MS);
  const url = opts.url ?? `${import.meta.env.BASE_URL}maintenance.json`;

  let timer: ReturnType<typeof setInterval> | null = null;

  async function check(): Promise<void> {
    try {
      const res = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
      maintenance.value = res.ok ? parseMaintenance(await res.text()) : { ...OFF };
    } catch {
      maintenance.value = { ...OFF }; // offline / CDN down — fail open
    }
  }

  const onVisibility = () => {
    if (document.visibilityState === 'visible') void check();
  };

  onMounted(() => {
    if (!enabled) return;
    void check();
    timer = setInterval(() => void check(), intervalMs);
    document.addEventListener('visibilitychange', onVisibility);
  });
  onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibility);
  });

  return { maintenance, check };
}
