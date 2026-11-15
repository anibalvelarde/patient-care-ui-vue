// WP-65 (owner request 2026-11-15): an open tab learns that a newer build was deployed.
//   - every hour (and when the tab becomes visible after more than an hour) fetch /version.json,
//     never cached, and compare its commit with the bundle's → a dismissable "Reload" banner
//     that comes back at the next hourly check; never an automatic reload; off in dev;
//   - a page chunk the deploy deleted ("Failed to fetch dynamically imported module") → load that
//     page fresh, at most once per 30 s.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { useNewVersionCheck, VERSION_CHECK_INTERVAL_MS, type VersionCheckOptions } from '../composables/useNewVersionCheck';
import { isStaleChunkError, reloadOnce, installStaleChunkReload } from '../utils/staleChunkReload';
import NewVersionBanner from '../components/shared/NewVersionBanner.vue';

const HOUR = VERSION_CHECK_INTERVAL_MS;

enableAutoUnmount(afterEach);

function harness(opts: VersionCheckOptions) {
  let api!: ReturnType<typeof useNewVersionCheck>;
  mount(defineComponent({
    setup() {
      api = useNewVersionCheck({ currentCommit: 'aaaaaaa', enabled: true, url: '/version.json', ...opts });
      return () => h('div');
    },
  }));
  return api;
}

function serve(commit: string | null, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({ ok, json: async () => (commit === null ? {} : { version: '102', commit }) });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('useNewVersionCheck — WP-65', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
  });

  it('checks once an hour, not on load, with a never-cached request', async () => {
    const fetchMock = serve('aaaaaaa');
    const api = harness({});

    await vi.advanceTimersByTimeAsync(HOUR - 1000);
    expect(fetchMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/^\/version\.json\?t=\d+$/);
    expect(init.cache).toBe('no-store');
    expect(api.bannerVisible.value).toBe(false); // same commit → nothing to say
  });

  it('a different deployed commit shows the banner; it never reloads on its own', async () => {
    serve('bbbbbbb');
    const reload = vi.fn();
    const api = harness({ reload });

    await vi.advanceTimersByTimeAsync(HOUR);
    expect(api.updateAvailable.value).toBe(true);
    expect(api.bannerVisible.value).toBe(true);
    expect(reload).not.toHaveBeenCalled();

    api.reload();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('owner default: Later hides it until the next hourly check', async () => {
    serve('bbbbbbb');
    const api = harness({});
    await vi.advanceTimersByTimeAsync(HOUR);

    api.dismiss();
    expect(api.bannerVisible.value).toBe(false);
    await vi.advanceTimersByTimeAsync(HOUR - 1000);
    expect(api.bannerVisible.value).toBe(false);
    await vi.advanceTimersByTimeAsync(1000);
    expect(api.bannerVisible.value).toBe(true);
  });

  it('tab coming back into view checks only if the last check is over an hour old (e.g. laptop slept)', async () => {
    const fetchMock = serve('bbbbbbb');
    harness({});

    setVisibility('hidden');
    setVisibility('visible');
    expect(fetchMock).not.toHaveBeenCalled(); // just loaded

    vi.setSystemTime(Date.now() + HOUR + 60_000); // the clock moved; the interval didn't fire (sleep)
    setVisibility('visible');
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('offline, an error status, or a file without a commit → no banner and no crash', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const offline = harness({});
    await vi.advanceTimersByTimeAsync(HOUR);
    expect(offline.bannerVisible.value).toBe(false);

    serve('bbbbbbb', false);
    const notFound = harness({});
    await vi.advanceTimersByTimeAsync(HOUR);
    expect(notFound.bannerVisible.value).toBe(false);

    serve(null);
    const noCommit = harness({});
    await vi.advanceTimersByTimeAsync(HOUR);
    expect(noCommit.bannerVisible.value).toBe(false);
  });

  it('disabled (dev builds) never checks', async () => {
    const fetchMock = serve('bbbbbbb');
    harness({ enabled: false });
    await vi.advanceTimersByTimeAsync(3 * HOUR);
    setVisibility('visible');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('the dev/test bundle itself is disabled by default (__APP_VERSION__ = "dev")', async () => {
    const fetchMock = serve('bbbbbbb');
    mount(defineComponent({ setup() { useNewVersionCheck(); return () => h('div'); } }));
    await vi.advanceTimersByTimeAsync(2 * HOUR);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('NewVersionBanner — WP-65', () => {
  it('shows only when visible and emits reload / dismiss', async () => {
    expect(mount(NewVersionBanner, { props: { visible: false } }).find('[data-testid="new-version-banner"]').exists()).toBe(false);

    const wrapper = mount(NewVersionBanner, { props: { visible: true } });
    expect(wrapper.text()).toContain('A new version of the app is available.');
    await wrapper.find('[data-testid="new-version-reload"]').trigger('click');
    await wrapper.find('[data-testid="new-version-dismiss"]').trigger('click');
    expect(wrapper.emitted('reload')).toHaveLength(1);
    expect(wrapper.emitted('dismiss')).toHaveLength(1);
  });
});

describe('staleChunkReload — WP-65', () => {
  beforeEach(() => { window.sessionStorage.clear(); });

  it('recognises the browsers\' stale-chunk errors and nothing else', () => {
    expect(isStaleChunkError(new TypeError('Failed to fetch dynamically imported module: https://x/assets/AdminView-abc.js'))).toBe(true);
    expect(isStaleChunkError(new TypeError('error loading dynamically imported module'))).toBe(true);
    expect(isStaleChunkError(new TypeError('Importing a module script failed.'))).toBe(true);
    expect(isStaleChunkError(new Error('Unable to preload CSS for /assets/AdminView-abc.css'))).toBe(true);
    expect(isStaleChunkError(new Error('Request failed with status 500'))).toBe(false);
    expect(isStaleChunkError(undefined)).toBe(false);
  });

  it('reloads at most once per 30 s (no loop if the chunk is really missing)', () => {
    const navigate = vi.fn();
    const t0 = 1_000_000;
    expect(reloadOnce('/admin', navigate, window.sessionStorage, t0)).toBe(true);
    expect(reloadOnce('/admin', navigate, window.sessionStorage, t0 + 5_000)).toBe(false);
    expect(reloadOnce('/admin', navigate, window.sessionStorage, t0 + 31_000)).toBe(true);
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenCalledWith('/admin');
  });

  it('a route whose chunk is gone loads that route fresh; other route errors are left alone', async () => {
    const navigate = vi.fn();
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { render: () => h('div') } },
        { path: '/admin', component: () => Promise.reject(new TypeError('Failed to fetch dynamically imported module: /assets/AdminView-old.js')) },
        { path: '/broken', component: () => Promise.reject(new Error('boom')) },
      ],
    });
    installStaleChunkReload(router, navigate);
    await router.push('/');

    await router.push('/admin?tab=gaps').catch(() => undefined);
    expect(navigate).toHaveBeenCalledWith('/admin?tab=gaps');

    window.sessionStorage.clear();
    navigate.mockClear();
    await router.push('/broken').catch(() => undefined);
    expect(navigate).not.toHaveBeenCalled();
  });
});
