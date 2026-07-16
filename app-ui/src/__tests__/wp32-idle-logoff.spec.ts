// WP-32 (U4) — idle auto-logoff: composable timing, warning modal, and the Sites setting field.
//
// Fake-timers note (see testing-guide.md "Idle auto-logoff"): idle is computed from a wall-clock
// timestamp in localStorage, and vitest's fake timers mock Date too — so advancing timers advances
// both the interval ticks AND Date.now(), and the timestamp math stays consistent. Use the *Async
// timer helpers so the router.push() inside logout resolves between ticks.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia, type Pinia } from 'pinia';
import { createRouter, createMemoryHistory, type Router } from 'vue-router';
import { defineComponent } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';
import { useIdleLogoff } from '../composables/useIdleLogoff';
import IdleWarningModal from '../components/shared/IdleWarningModal.vue';
import SiteFormModal from '../components/sites/SiteFormModal.vue';
import type { Site } from '../interfaces/Site';

// ---- SitesHttpClient mock (for the SiteFormModal block) -------------------------------------
const { updateSiteMock, createSiteMock } = vi.hoisted(() => ({
  updateSiteMock: vi.fn(),
  createSiteMock: vi.fn(),
}));
vi.mock('../services/SitesHttpClient', () => ({
  SitesHttpClient: vi.fn().mockImplementation(() => ({
    updateSite: updateSiteMock,
    createSite: createSiteMock,
  })),
}));

// ============================================================================================
// useIdleLogoff — timing behavior
// ============================================================================================

const Host = defineComponent({
  name: 'IdleHost',
  setup() {
    return useIdleLogoff();
  },
  template: '<div />',
});

interface IdleHostVm {
  warningVisible: boolean;
  secondsRemaining: number;
  stayActive: () => void;
  signOutNow: () => void;
}

function makeRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: { template: '<div/>' } },
      { path: '/login', name: 'login', component: { template: '<div/>' } },
    ],
  });
}

function authPinia(idleLogoffMinutes: number): Pinia {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useAuthStore();
  store.accessToken = 'test-token';
  store.user = {
    userId: 1,
    email: 'test@example.com',
    fullName: 'Test User',
    mustChangePassword: false,
    roles: ['MGR'],
    claims: [],
    isSystemAdmin: false,
    idleLogoffMinutes,
  };
  return pinia;
}

async function mountIdle(minutes: number) {
  const pinia = authPinia(minutes);
  const router = makeRouter();
  router.push('/');
  await router.isReady();
  const wrapper = mount(Host, { global: { plugins: [pinia, router] } });
  return {
    wrapper,
    router,
    auth: useAuthStore(),
    notifications: useNotificationsStore(),
    vm: wrapper.vm as unknown as IdleHostVm,
  };
}

describe('useIdleLogoff', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the warning 60s before expiry, not before', async () => {
    const { wrapper, vm } = await mountIdle(2); // 120s expiry, warn at 60s idle

    await vi.advanceTimersByTimeAsync(30_000);
    expect(vm.warningVisible).toBe(false);

    await vi.advanceTimersByTimeAsync(30_000); // now at 60s idle
    expect(vm.warningVisible).toBe(true);
    expect(vm.secondsRemaining).toBe(60);

    wrapper.unmount();
  });

  it('logs the user out at expiry with an inactivity notice', async () => {
    const { wrapper, auth, router, notifications } = await mountIdle(2);

    await vi.advanceTimersByTimeAsync(120_000);
    await flushPromises();

    expect(auth.isAuthenticated).toBe(false);
    expect(router.currentRoute.value.name).toBe('login');
    expect(notifications.items.some((n) => n.kind === 'error' && /inactivity/i.test(n.message))).toBe(true);

    wrapper.unmount();
  });

  it('"I\'m still here" resets the clock and prevents the logout', async () => {
    const { wrapper, vm, auth } = await mountIdle(2);

    await vi.advanceTimersByTimeAsync(60_000);
    expect(vm.warningVisible).toBe(true);

    vm.stayActive();
    await flushPromises();
    expect(vm.warningVisible).toBe(false);

    // 59s more: still short of a fresh 60s idle window — no warning, still signed in.
    await vi.advanceTimersByTimeAsync(59_000);
    expect(vm.warningVisible).toBe(false);
    expect(auth.isAuthenticated).toBe(true);

    wrapper.unmount();
  });

  it('"Sign out now" logs out immediately without an inactivity toast', async () => {
    const { wrapper, vm, auth, router, notifications } = await mountIdle(2);

    vm.signOutNow();
    await flushPromises();

    expect(auth.isAuthenticated).toBe(false);
    expect(router.currentRoute.value.name).toBe('login');
    expect(notifications.items.some((n) => /inactivity/i.test(n.message))).toBe(false);

    wrapper.unmount();
  });

  it('user activity resets the idle clock (delays the warning)', async () => {
    const { wrapper, vm } = await mountIdle(2);

    await vi.advanceTimersByTimeAsync(30_000);
    window.dispatchEvent(new Event('keydown')); // activity at 30s resets lastActivity

    await vi.advanceTimersByTimeAsync(30_000); // 60s absolute, but only 30s idle
    expect(vm.warningVisible).toBe(false);

    wrapper.unmount();
  });

  it('activity in another tab (localStorage) dismisses the warning', async () => {
    const { wrapper, vm, auth } = await mountIdle(2);

    await vi.advanceTimersByTimeAsync(60_000);
    expect(vm.warningVisible).toBe(true);

    // Simulate a second tab recording activity: bump the shared timestamp to "now".
    localStorage.setItem('pc_last_activity', String(Date.now()));

    await vi.advanceTimersByTimeAsync(1_000); // next countdown tick re-reads localStorage
    expect(vm.warningVisible).toBe(false);
    expect(auth.isAuthenticated).toBe(true);

    wrapper.unmount();
  });

  it('0 minutes disables the feature — never warns or logs out', async () => {
    const { wrapper, vm, auth } = await mountIdle(0);

    await vi.advanceTimersByTimeAsync(600_000); // 10 minutes
    expect(vm.warningVisible).toBe(false);
    expect(auth.isAuthenticated).toBe(true);

    wrapper.unmount();
  });
});

// ============================================================================================
// IdleWarningModal — presentation
// ============================================================================================

describe('IdleWarningModal', () => {
  it('renders the countdown and both buttons when visible', () => {
    const wrapper = mount(IdleWarningModal, {
      props: { visible: true, secondsRemaining: 42 },
      global: { stubs: { teleport: true } },
    });
    expect(wrapper.find('[data-testid="idle-warning-modal"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="idle-countdown"]').text()).toBe('42');
    expect(wrapper.find('[data-testid="idle-stay-button"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="idle-signout-button"]').exists()).toBe(true);
  });

  it('renders nothing when not visible', () => {
    const wrapper = mount(IdleWarningModal, {
      props: { visible: false, secondsRemaining: 10 },
      global: { stubs: { teleport: true } },
    });
    expect(wrapper.find('[data-testid="idle-warning-modal"]').exists()).toBe(false);
  });

  it('emits stay / signout on the respective buttons', async () => {
    const wrapper = mount(IdleWarningModal, {
      props: { visible: true, secondsRemaining: 30 },
      global: { stubs: { teleport: true } },
    });
    await wrapper.find('[data-testid="idle-stay-button"]').trigger('click');
    await wrapper.find('[data-testid="idle-signout-button"]').trigger('click');
    expect(wrapper.emitted('stay')).toHaveLength(1);
    expect(wrapper.emitted('signout')).toHaveLength(1);
  });
});

// ============================================================================================
// SiteFormModal — the admin setting field
// ============================================================================================

function site(overrides: Partial<Site> = {}): Site {
  return {
    siteId: 1,
    siteName: 'Main Clinic',
    ruc: '123',
    inceptionDate: '2020-01-15',
    address: 'Somewhere',
    latitude: null,
    longitude: null,
    idleLogoffMinutes: 60,
    ...overrides,
  };
}

describe('SiteFormModal idle-logoff field', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateSiteMock.mockResolvedValue(undefined);
    createSiteMock.mockResolvedValue(site());
  });

  async function openEdit(s: Site) {
    const wrapper = mount(SiteFormModal, {
      props: { visible: false, site: s },
      global: { stubs: { teleport: true } },
    });
    await wrapper.setProps({ visible: true });
    await flushPromises();
    return wrapper;
  }

  it('populates the idle input from the site on edit', async () => {
    const wrapper = await openEdit(site({ idleLogoffMinutes: 15 }));
    const input = wrapper.find('[data-testid="site-idle-logoff-input"]');
    expect((input.element as HTMLInputElement).value).toBe('15');
  });

  it('sends idleLogoffMinutes in the update payload', async () => {
    const wrapper = await openEdit(site({ idleLogoffMinutes: 60 }));
    await wrapper.find('[data-testid="site-idle-logoff-input"]').setValue(30);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(updateSiteMock).toHaveBeenCalledTimes(1);
    expect(updateSiteMock.mock.calls[0][1]).toMatchObject({ idleLogoffMinutes: 30 });
  });

  it('rejects an out-of-range value client-side (no API call)', async () => {
    const wrapper = await openEdit(site());
    await wrapper.find('[data-testid="site-idle-logoff-input"]').setValue(500);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(updateSiteMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('between 0 and 480');
  });
});
