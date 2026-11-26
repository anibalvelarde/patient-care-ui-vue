// WP-51 (maintenance mode / "shut-off valve"): stop data entry during a DB restore, with the API
// and DB possibly both down, so the flag is a never-cached /maintenance.json at the edge.
//   - checked on mount, every minute and on tab-visible; FAILS OPEN (missing file → CloudFront/nginx
//     serve index.html; network error; non-JSON; anything but a real `enabled: true` → OFF);
//   - non-SYSADMIN signed-in users get a full-screen lockout; SYSADMIN works under a banner;
//     signed-out users see a banner on the login page (the SYSADMIN must still be able to sign in);
//   - HttpClientBase refuses writes for non-SYSADMIN while ON (backstop); GET + anonymous auth pass.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia, type Pinia } from 'pinia';
import { useAuthStore } from '../stores/auth';
import { useMaintenanceMode, MAINTENANCE_CHECK_INTERVAL_MS, type MaintenanceCheckOptions } from '../composables/useMaintenanceMode';
import { maintenance, maintenanceGate, parseMaintenance, OFF, MAINTENANCE_MESSAGE_MAX } from '../services/maintenanceState';
import { HttpClientBase, MAINTENANCE_WRITE_BLOCKED } from '../services/HttpClientBase';
import { ApiError } from '../services/ApiError';
import App from '../App.vue';

const MINUTE = MAINTENANCE_CHECK_INTERVAL_MS;
const INDEX_HTML = '<!DOCTYPE html><html><head><script src="/config.js"></script></head><body><div id="app"></div></body></html>';

enableAutoUnmount(afterEach);

function harness(opts: MaintenanceCheckOptions = {}) {
  let api!: ReturnType<typeof useMaintenanceMode>;
  mount(defineComponent({
    setup() {
      api = useMaintenanceMode({ enabled: true, url: '/maintenance.json', ...opts });
      return () => h('div');
    },
  }));
  return api;
}

function serve(body: string, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({ ok, text: async () => body });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
}

function resetState() {
  maintenance.value = { ...OFF };
  maintenanceGate.setBypassGetter(() => false);
}

describe('parseMaintenance — WP-51 fail-open parsing', () => {
  it('turns on only for a real boolean `enabled: true`', () => {
    expect(parseMaintenance('{"enabled":true,"message":"Restoring","since":"2026-12-03T19:05:00Z"}'))
      .toEqual({ enabled: true, message: 'Restoring', since: '2026-12-03T19:05:00Z' });
    expect(parseMaintenance('{"enabled":true}')).toEqual({ enabled: true, message: '', since: null });
  });

  it.each([
    ['the SPA fallback (missing file)', INDEX_HTML],
    ['explicit off', '{"enabled":false}'],
    ['string "true"', '{"enabled":"true"}'],
    ['number 1', '{"enabled":1}'],
    ['an array', '[true]'],
    ['null', 'null'],
    ['empty body', ''],
    ['garbage', '{enabled: true'],
  ])('reads %s as OFF', (_label, body) => {
    expect(parseMaintenance(body).enabled).toBe(false);
  });

  it('trims and caps the message', () => {
    const long = 'x'.repeat(MAINTENANCE_MESSAGE_MAX + 50);
    expect(parseMaintenance(JSON.stringify({ enabled: true, message: `  ${long}  ` })).message)
      .toHaveLength(MAINTENANCE_MESSAGE_MAX);
    expect(parseMaintenance('{"enabled":true,"message":42}').message).toBe('');
  });
});

describe('useMaintenanceMode — WP-51', () => {
  beforeEach(() => { vi.useFakeTimers(); resetState(); });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    resetState();
  });

  it('checks immediately on mount with a never-cached request, then every minute', async () => {
    const fetchMock = serve('{"enabled":false}');
    harness();
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/^\/maintenance\.json\?t=\d+$/);
    expect(init).toEqual({ cache: 'no-store' });

    await vi.advanceTimersByTimeAsync(MINUTE);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('turns on, then unlocks at the next check when the flag goes off (no reload)', async () => {
    serve('{"enabled":true,"message":"Back by 14:30"}');
    harness();
    await flushPromises();
    expect(maintenance.value).toMatchObject({ enabled: true, message: 'Back by 14:30' });

    serve('{"enabled":false}');
    await vi.advanceTimersByTimeAsync(MINUTE);
    expect(maintenance.value.enabled).toBe(false);
  });

  it('fails open on a network error, a non-OK status and the index.html fallback', async () => {
    maintenance.value = { enabled: true, message: '', since: null };
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const api = harness();
    await flushPromises();
    expect(maintenance.value.enabled).toBe(false);

    maintenance.value = { enabled: true, message: '', since: null };
    serve('{"enabled":true}', false); // e.g. the K3s proxy answering 502
    await api.check();
    expect(maintenance.value.enabled).toBe(false);

    maintenance.value = { enabled: true, message: '', since: null };
    serve(INDEX_HTML);
    await api.check();
    expect(maintenance.value.enabled).toBe(false);
  });

  it('re-checks when the tab becomes visible', async () => {
    const fetchMock = serve('{"enabled":false}');
    harness();
    await flushPromises();
    setVisibility('hidden');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    setVisibility('visible');
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does nothing when disabled (dev builds)', async () => {
    const fetchMock = serve('{"enabled":true}');
    harness({ enabled: false });
    await vi.advanceTimersByTimeAsync(MINUTE * 3);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(maintenance.value.enabled).toBe(false);
  });
});

// ---- App shell: lockout vs banner -------------------------------------------------------------

function pinia(as: 'FD' | 'SA' | 'anon'): Pinia {
  const p = createPinia();
  setActivePinia(p);
  const store = useAuthStore();
  if (as !== 'anon') {
    store.accessToken = 'token';
    store.user = {
      userId: 1, email: 'test@example.com', fullName: 'Test User',
      mustChangePassword: false, roles: as === 'FD' ? ['FD'] : [], claims: [],
      isSystemAdmin: as === 'SA',
    };
  }
  return p;
}

async function mountApp(as: 'FD' | 'SA' | 'anon') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { render: () => h('div', { 'data-testid': 'home' }) } },
      { path: '/login', name: 'login', component: { render: () => h('div', { 'data-testid': 'login' }) } },
    ],
  });
  await router.push(as === 'anon' ? '/login' : '/');
  const wrapper = mount(App, { global: { plugins: [pinia(as), router], stubs: { teleport: true } } });
  await flushPromises();
  return { wrapper, router };
}

describe('App shell — WP-51 lockout and banner', () => {
  beforeEach(() => { resetState(); });
  afterEach(() => { resetState(); });

  it('shows nothing while the valve is off', async () => {
    const { wrapper } = await mountApp('FD');
    expect(wrapper.find('[data-testid="maintenance-lockout"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="maintenance-banner"]').exists()).toBe(false);
  });

  it('locks a non-SYSADMIN user out, with the message, and Sign out goes to login', async () => {
    maintenance.value = { enabled: true, message: 'Restoring data — back by 14:30', since: null };
    const { wrapper, router } = await mountApp('FD');
    expect(wrapper.find('[data-testid="maintenance-lockout"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="maintenance-lockout-message"]').text()).toBe('Restoring data — back by 14:30');
    expect(wrapper.find('[data-testid="maintenance-banner"]').exists()).toBe(false);

    await wrapper.find('[data-testid="maintenance-lockout-logout"]').trigger('click');
    await flushPromises();
    expect(useAuthStore().isAuthenticated).toBe(false);
    expect(router.currentRoute.value.name).toBe('login');
  });

  it('lets SYSADMIN work under a persistent banner', async () => {
    maintenance.value = { enabled: true, message: 'Restore drill', since: null };
    const { wrapper } = await mountApp('SA');
    expect(wrapper.find('[data-testid="maintenance-lockout"]').exists()).toBe(false);
    const banner = wrapper.find('[data-testid="maintenance-banner"]');
    expect(banner.text()).toContain('Maintenance mode is ON');
    expect(banner.text()).toContain('Restore drill');
    expect(wrapper.find('[data-testid="home"]').exists()).toBe(true);
  });

  it('keeps the login page reachable for a signed-out user, with an explanatory banner', async () => {
    maintenance.value = { enabled: true, message: '', since: null };
    const { wrapper } = await mountApp('anon');
    expect(wrapper.find('[data-testid="login"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="maintenance-lockout"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="maintenance-banner"]').text())
      .toContain('Only the system administrator can sign in');
  });

  it('unlocks an open tab the moment the valve goes off', async () => {
    maintenance.value = { enabled: true, message: '', since: null };
    const { wrapper } = await mountApp('FD');
    expect(wrapper.find('[data-testid="maintenance-lockout"]').exists()).toBe(true);
    maintenance.value = { ...OFF };
    await flushPromises();
    expect(wrapper.find('[data-testid="maintenance-lockout"]').exists()).toBe(false);
  });
});

// ---- HttpClientBase write gate ------------------------------------------------------------------

class TestClient extends HttpClientBase {
  getT() { return this.get('/api/x'); }
  postT() { return this.post('/api/x', {}); }
  putT() { return this.put('/api/x', {}); }
  deleteT() { return this.delete('/api/x'); }
  loginT() { return this.postAnonymous('/api/auth/login', {}); }
}

describe('HttpClientBase — WP-51 write gate', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    resetState();
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '{}' } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => { vi.unstubAllGlobals(); resetState(); });

  it('refuses POST/PUT/DELETE for a non-SYSADMIN while ON, without calling the API', async () => {
    maintenance.value = { enabled: true, message: '', since: null };
    const c = new TestClient();
    for (const call of [() => c.postT(), () => c.putT(), () => c.deleteT()]) {
      const err = await call().catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).message).toBe(MAINTENANCE_WRITE_BLOCKED);
      expect((err as ApiError).code).toBe('maintenance');
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('still allows reads and the anonymous login/refresh calls', async () => {
    maintenance.value = { enabled: true, message: '', since: null };
    const c = new TestClient();
    await c.getT();
    await c.loginT();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('lets SYSADMIN write while ON, and everyone write while OFF', async () => {
    const c = new TestClient();
    maintenance.value = { enabled: true, message: '', since: null };
    maintenanceGate.setBypassGetter(() => true);
    await c.postT();
    maintenanceGate.setBypassGetter(() => false);
    maintenance.value = { ...OFF };
    await c.putT();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
