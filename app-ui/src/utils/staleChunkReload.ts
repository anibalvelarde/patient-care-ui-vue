// utils/staleChunkReload.ts
//
// WP-65: a tab opened before a deploy still names the OLD hashed page chunks; the deploy deleted
// them (S3 `sync --delete`, a new K3s image), so opening a not-yet-visited page fails with
// "Failed to fetch dynamically imported module". Instead of a dead click, load that page fresh
// (which pulls the new build). Guarded so a genuinely missing chunk can't cause a reload loop.

import type { Router } from 'vue-router';

const GUARD_KEY = 'nc.staleChunkReloadAt';
const GUARD_WINDOW_MS = 30_000;

const STALE_CHUNK_PATTERNS = [
  /Failed to fetch dynamically imported module/i, // Chromium
  /error loading dynamically imported module/i,   // Firefox
  /Importing a module script failed/i,            // Safari
  /Unable to preload CSS/i,                       // Vite CSS preload
];

export function isStaleChunkError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  return STALE_CHUNK_PATTERNS.some((re) => re.test(message));
}

export type Navigate = (path: string) => void;
const fullPageLoad: Navigate = (path) => window.location.assign(path);

/** Navigate to `path` with a full page load, unless we already did so in the last 30 s. */
export function reloadOnce(
  path: string,
  navigate: Navigate = fullPageLoad,
  storage: Storage = window.sessionStorage,
  now = Date.now(),
): boolean {
  const last = Number(storage.getItem(GUARD_KEY) ?? 0);
  if (now - last < GUARD_WINDOW_MS) return false;
  storage.setItem(GUARD_KEY, String(now));
  navigate(path);
  return true;
}

export function installStaleChunkReload(router: Router, navigate: Navigate = fullPageLoad): void {
  // A failed lazy import (including Vite's CSS/dep preload failure, which rejects the same import)
  // reaches router.onError together with the page being opened — reload straight to that page.
  router.onError((err, to) => {
    if (isStaleChunkError(err)) reloadOnce(to.fullPath, navigate);
  });
}
