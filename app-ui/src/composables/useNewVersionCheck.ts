// composables/useNewVersionCheck.ts
//
// WP-65 (owner request 2026-11-15): an open tab keeps running the build it loaded until someone
// reloads, so staff could work on an old version for days. Every hour — and when the tab comes
// back into view after more than an hour — fetch /version.json (written by the build, served
// never-cached) and compare its commit with the one baked into this bundle. A mismatch shows the
// "new version" banner. We never reload on our own: a reload could drop half-entered work (the
// WP-64 guard still warns on Reload if a drawer has unsaved edits).
// Owner defaults: hourly; the banner can be dismissed and comes back at the next hourly check.
// Disabled in dev (`__APP_VERSION__ === 'dev'`), where there is no version.json.

import { onBeforeUnmount, onMounted, ref } from 'vue';

export const VERSION_CHECK_INTERVAL_MS = 60 * 60 * 1000;
// Local test builds only (e.g. VITE_VERSION_CHECK_INTERVAL_MS=60000 for a 1-minute check); CI never
// sets it, so deployed builds check hourly.
const BUILD_INTERVAL_MS = Number(import.meta.env.VITE_VERSION_CHECK_INTERVAL_MS) || VERSION_CHECK_INTERVAL_MS;

export interface VersionCheckOptions {
  currentCommit?: string;
  enabled?: boolean;
  intervalMs?: number;
  url?: string;
  /** Test seam — defaults to a full page reload. */
  reload?: () => void;
}

export function useNewVersionCheck(opts: VersionCheckOptions = {}) {
  const currentCommit = opts.currentCommit ?? __APP_COMMIT__;
  const enabled = opts.enabled ?? __APP_VERSION__ !== 'dev';
  const intervalMs = opts.intervalMs ?? BUILD_INTERVAL_MS;
  const url = opts.url ?? `${import.meta.env.BASE_URL}version.json`;

  const updateAvailable = ref(false); // a newer build is deployed
  const bannerVisible = ref(false);   // ...and the user hasn't dismissed it since the last check
  let lastCheck = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  async function check(): Promise<void> {
    lastCheck = Date.now();
    try {
      const res = await fetch(`${url}?t=${lastCheck}`, { cache: 'no-store' });
      if (!res.ok) return;
      const body = (await res.json()) as { commit?: unknown };
      if (typeof body.commit === 'string' && body.commit !== '' && body.commit !== currentCommit) {
        updateAvailable.value = true;
        bannerVisible.value = true; // a dismissed banner comes back at the next check
      }
    } catch {
      // offline / tunnel down — try again next time
    }
  }

  const onVisibility = () => {
    if (document.visibilityState === 'visible' && Date.now() - lastCheck >= intervalMs) void check();
  };

  function dismiss() { bannerVisible.value = false; }
  const reload = opts.reload ?? (() => window.location.reload());

  onMounted(() => {
    if (!enabled) return;
    lastCheck = Date.now(); // the bundle we're running was just loaded — first check in an hour
    timer = setInterval(() => void check(), intervalMs);
    document.addEventListener('visibilitychange', onVisibility);
  });
  onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibility);
  });

  return { updateAvailable, bannerVisible, check, dismiss, reload };
}
