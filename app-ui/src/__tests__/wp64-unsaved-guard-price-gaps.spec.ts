// WP-64 (owner requests 2026-11-14, after the WP-61 localhost test):
//   1. Unsaved-changes guard — the plan drawer and the scheduling wizard ask "Discard changes?"
//      before a backdrop click / X / Cancel / route change / browser refresh throws edits away.
//      Clean forms close silently; logoff (→ login) is never blocked.
//   2. Price-gap audit — Admin › Specialty Types gets a "Price gaps" tab listing each specialty
//      with durations that have no price and no default (badge = number of such specialties).
// Synthetic data only.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import { createRouter, createMemoryHistory, RouterView } from 'vue-router';
import { createPinia, setActivePinia, type Pinia } from 'pinia';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import type { TreatmentPlan, TreatmentPlanLine, DiscoverySessionSummary } from '../interfaces/TreatmentPlan';
import type { LookupItem } from '../interfaces/Lookups';
import { useUnsavedChangesGuard } from '../composables/useUnsavedChangesGuard';
import { findPriceGaps } from '../utils/linePrice';
import TreatmentPlanFormModal from '../components/treatment-plans/TreatmentPlanFormModal.vue';
import SchedulePlanWizard from '../components/treatment-plans/SchedulePlanWizard.vue';
import SpecialtyPriceGapsPanel from '../components/admin/SpecialtyPriceGapsPanel.vue';
import AdminView from '../views/AdminView.vue';

const { plansMocks, lookupMocks, therapistsMocks, sessionsMocks, sitesMocks, patientsMocks } = vi.hoisted(() => ({
  plansMocks: { create: vi.fn(), update: vi.fn(), activate: vi.fn(), schedule: vi.fn(), getProgress: vi.fn() },
  lookupMocks: { getAll: vi.fn(), create: vi.fn(), update: vi.fn() },
  therapistsMocks: { getTherapists: vi.fn() },
  sessionsMocks: { getDiscoverySessions: vi.fn() },
  sitesMocks: { getSites: vi.fn() },
  patientsMocks: { getPatient: vi.fn(), getPatientCaretakers: vi.fn() },
}));

vi.mock('../services/TreatmentPlansHttpClient', () => ({
  TreatmentPlansHttpClient: vi.fn().mockImplementation(() => ({ ...plansMocks })),
}));
vi.mock('../services/LookupHttpClient', () => ({
  LookupHttpClient: vi.fn().mockImplementation(() => ({ ...lookupMocks })),
}));
vi.mock('../services/TherapistsHttpClient', () => ({
  TherapistsHttpClient: vi.fn().mockImplementation(() => ({ ...therapistsMocks })),
}));
vi.mock('../services/SessionsHttpClient', () => ({
  SessionsHttpClient: vi.fn().mockImplementation(() => ({ ...sessionsMocks })),
}));
vi.mock('../services/SitesHttpClient', () => ({
  SitesHttpClient: vi.fn().mockImplementation(() => ({ ...sitesMocks })),
}));
vi.mock('../services/PatientsHttpClient', () => ({
  PatientsHttpClient: vi.fn().mockImplementation(() => ({ ...patientsMocks })),
}));

function claimsForRole(role: string): ClaimDto[] {
  return (manifest.claims as Array<{ claim: string; grants: string[] }>)
    .filter((c) => c.grants.includes(role))
    .map((c) => ({ type: 'Permission', value: c.claim }));
}

function authAs(role: string): Pinia {
  const pinia = createPinia();
  setActivePinia(pinia);
  useAuthStore().user = {
    userId: 1, email: 'test@example.com', fullName: 'Test User',
    mustChangePassword: false, roles: [role], claims: claimsForRole(role),
    isSystemAdmin: false,
  };
  return pinia;
}

// ── factories ────────────────────────────────────────────────────────────────

const TL = 6;   // 30-min price row only, no default → gaps at 45/60/90/120
const EEG = 15; // default only → no gaps
const OT = 7;   // nothing at all → gaps everywhere

function specialty(overrides: Partial<LookupItem> = {}): LookupItem {
  return {
    id: TL, abbreviation: 'TL', name: 'Language Therapy', description: null, sortOrder: 1,
    defaultAmount: null, durationPrices: [], createdTimestamp: '', lastUpdatedTimestamp: '', ...overrides,
  };
}

const SPECIALTIES: LookupItem[] = [
  specialty({ id: OT, abbreviation: 'OT', name: 'Occupational Therapy', sortOrder: 3 }),
  specialty({ id: TL, durationPrices: [{ durationMinutes: 30, amount: 50, effectiveFrom: '2026-01-01' }] }),
  specialty({ id: EEG, abbreviation: 'EEG', name: 'Electroencephalogram', sortOrder: 2, defaultAmount: 75 }),
];

function discovery(overrides: Partial<DiscoverySessionSummary> = {}): DiscoverySessionSummary {
  return { sessionId: 100, sessionDate: '2026-11-10', specialtyAbbreviation: 'Eval-Full',
    therapistId: 9, therapistName: 'Synthetic, Nine', ...overrides };
}

function line(overrides: Partial<TreatmentPlanLine> = {}): TreatmentPlanLine {
  return { id: 13, treatmentPlanId: 6, specialtyTypeId: TL, specialtyAbbreviation: 'TL',
    specialtyName: 'Language Therapy', preferredTherapistId: null, preferredTherapistName: null,
    dayOfWeek: 2, preferredTime: '10:00', duration: 30, sortOrder: 1, ...overrides };
}

function plan(overrides: Partial<TreatmentPlan> = {}): TreatmentPlan {
  return {
    id: 6, displayTitle: 'TP | Synthetic, P. | 2026-11-14 | 1x/week', patientId: 921,
    patientName: 'Pat Synthetic', discoverySessionId: 100, discoveryDate: '2026-11-10',
    discoverySpecialty: 'Eval-Full', createdByTherapistId: 9, createdByTherapistName: 'Synthetic, Nine',
    planStatus: 'Draft', canEditLines: true, resultsDocumentUrl: null, weeklyFrequency: 1,
    durationWeeks: 4, notes: null, createdTimestamp: '2026-11-14T15:00:00Z',
    lastUpdatedTimestamp: '2026-11-14T15:00:00Z', lines: [line()], ...overrides,
  };
}

// Drawers left mounted would keep their beforeunload listeners across tests.
enableAutoUnmount(afterEach);

beforeEach(() => {
  vi.clearAllMocks();
  lookupMocks.getAll.mockResolvedValue([...SPECIALTIES]); // a copy — the drawer sorts it in place
  therapistsMocks.getTherapists.mockResolvedValue([]);
  sessionsMocks.getDiscoverySessions.mockResolvedValue([discovery()]);
  plansMocks.schedule.mockResolvedValue({ planId: 6, sessionsCreated: 4, sessions: [], conflicts: [] });
  sitesMocks.getSites.mockResolvedValue([{ siteId: 1, siteName: 'Main' }]);
  patientsMocks.getPatient.mockResolvedValue({ patientId: 921, hasSenadisDiscount: false });
  patientsMocks.getPatientCaretakers.mockResolvedValue([{ caretakerId: 1 }]);
});

const dialog = (w: { find: (s: string) => { exists: () => boolean } }) => w.find('[data-testid="unsaved-dialog"]');

// ── 1a. plan drawer ──────────────────────────────────────────────────────────

type FormVm = { form: { notes: string; discoverySessionId: number }; lines: Array<{ duration: number }> };

async function openForm(p: TreatmentPlan | null) {
  const wrapper = mount(TreatmentPlanFormModal, {
    props: { visible: false, plan: p, patientId: 921 },
    global: { plugins: [authAs('MGR')], stubs: { teleport: true } },
  });
  await wrapper.setProps({ visible: true });
  await flushPromises();
  return wrapper;
}

describe('TreatmentPlanFormModal — WP-64 unsaved-changes guard', () => {
  it('an untouched new plan closes on a backdrop click without asking (auto-picked discovery is not an edit)', async () => {
    const wrapper = await openForm(null);
    expect((wrapper.vm as unknown as FormVm).form.discoverySessionId).toBe(100); // auto-selected

    await wrapper.find('[data-testid="plan-drawer-backdrop"]').trigger('click');
    await flushPromises();

    expect(dialog(wrapper).exists()).toBe(false);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it.each(['plan-drawer-backdrop', 'plan-drawer-x', 'plan-cancel'])(
    'with edits, %s asks first and does not close',
    async (testid) => {
      const wrapper = await openForm(null);
      (wrapper.vm as unknown as FormVm).form.notes = 'typed something';
      await nextTick();

      await wrapper.find(`[data-testid="${testid}"]`).trigger('click');
      await flushPromises();

      expect(dialog(wrapper).exists()).toBe(true);
      expect(wrapper.emitted('close')).toBeUndefined();
    },
  );

  it('Keep editing dismisses the dialog and keeps the edits', async () => {
    const wrapper = await openForm(null);
    const vm = wrapper.vm as unknown as FormVm;
    vm.form.notes = 'typed something';
    await nextTick();
    await wrapper.find('[data-testid="plan-drawer-backdrop"]').trigger('click');
    await flushPromises();

    await wrapper.find('[data-testid="unsaved-keep"]').trigger('click');
    await flushPromises();

    expect(dialog(wrapper).exists()).toBe(false);
    expect(wrapper.emitted('close')).toBeUndefined();
    expect(vm.form.notes).toBe('typed something');
  });

  it('Discard closes the drawer', async () => {
    const wrapper = await openForm(null);
    (wrapper.vm as unknown as FormVm).form.notes = 'typed something';
    await nextTick();
    await wrapper.find('[data-testid="plan-cancel"]').trigger('click');
    await flushPromises();

    await wrapper.find('[data-testid="unsaved-discard"]').trigger('click');
    await flushPromises();

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('editing an existing plan: changing a line counts; changing it back does not', async () => {
    const wrapper = await openForm(plan());
    const vm = wrapper.vm as unknown as FormVm;

    vm.lines[0].duration = 45;
    await nextTick();
    await wrapper.find('[data-testid="plan-drawer-x"]').trigger('click');
    await flushPromises();
    expect(dialog(wrapper).exists()).toBe(true);
    await wrapper.find('[data-testid="unsaved-keep"]').trigger('click');

    vm.lines[0].duration = 30; // back to what was opened
    await nextTick();
    await wrapper.find('[data-testid="plan-drawer-x"]').trigger('click');
    await flushPromises();
    expect(dialog(wrapper).exists()).toBe(false);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('browser refresh / tab close: prompts only while there are unsaved edits', async () => {
    const wrapper = await openForm(null);
    const fire = () => {
      const e = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(e);
      return e.defaultPrevented;
    };
    expect(fire()).toBe(false);

    (wrapper.vm as unknown as FormVm).form.notes = 'typed something';
    await nextTick();
    expect(fire()).toBe(true);

    wrapper.unmount();
    expect(fire()).toBe(false); // listener removed with the drawer
  });
});

// ── 1b. scheduling wizard ────────────────────────────────────────────────────

type WizardVm = { step: number; startDate: string; siteId: number };

async function openWizard() {
  const wrapper = mount(SchedulePlanWizard, {
    props: { visible: false, plan: plan({ planStatus: 'Active' }) },
    global: { plugins: [authAs('MGR')], stubs: { teleport: true } },
  });
  await wrapper.setProps({ visible: true });
  await flushPromises();
  return wrapper;
}

describe('SchedulePlanWizard — WP-64 unsaved-changes guard', () => {
  it('untouched step 1 closes without asking', async () => {
    const wrapper = await openWizard();
    await wrapper.find('[data-testid="wizard-backdrop"]').trigger('click');
    await flushPromises();

    expect(dialog(wrapper).exists()).toBe(false);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('after choosing a site, closing asks first; Discard closes', async () => {
    const wrapper = await openWizard();
    (wrapper.vm as unknown as WizardVm).siteId = 1;
    await nextTick();

    await wrapper.find('[data-testid="wizard-backdrop"]').trigger('click');
    await flushPromises();
    expect(dialog(wrapper).exists()).toBe(true);
    expect(wrapper.emitted('close')).toBeUndefined();

    await wrapper.find('[data-testid="unsaved-discard"]').trigger('click');
    await flushPromises();
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('once scheduled (step 3, no conflicts), Close needs no confirmation', async () => {
    const wrapper = await openWizard();
    const vm = wrapper.vm as unknown as WizardVm;
    vm.siteId = 1;
    vm.step = 2;
    await nextTick();
    await wrapper.find('[data-testid="wizard-schedule-button"]').trigger('click');
    await flushPromises();
    expect(vm.step).toBe(3);

    await wrapper.find('[data-testid="wizard-backdrop"]').trigger('click');
    await flushPromises();

    expect(dialog(wrapper).exists()).toBe(false);
    expect(wrapper.emitted('scheduled')).toHaveLength(1);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});

// ── 1c. route leave (real router) ────────────────────────────────────────────

describe('useUnsavedChangesGuard — leaving the page', () => {
  async function routedHarness() {
    const dirty = ref(true);
    let guard!: ReturnType<typeof useUnsavedChangesGuard>;
    const Page = defineComponent({
      setup() {
        guard = useUnsavedChangesGuard(dirty);
        return () => h('div', 'plans page');
      },
    });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/plans', component: Page },
        { path: '/patients', component: { render: () => h('div', 'patients') } },
        { path: '/login', name: 'login', component: { render: () => h('div', 'login') } },
      ],
    });
    await router.push('/plans');
    await router.isReady();
    mount(defineComponent({ render: () => h(RouterView) }), { global: { plugins: [router] } });
    await flushPromises();
    return { router, dirty, guard: () => guard };
  }

  it('navigating away with unsaved edits waits for the answer: Keep editing stays', async () => {
    const { router, guard } = await routedHarness();
    const nav = router.push('/patients');
    await flushPromises();
    expect(guard().confirmVisible.value).toBe(true);

    guard().keepEditing();
    await nav;
    expect(router.currentRoute.value.path).toBe('/plans');
  });

  it('Discard lets the navigation through', async () => {
    const { router, guard } = await routedHarness();
    const nav = router.push('/patients');
    await flushPromises();

    guard().discard();
    await nav;
    expect(router.currentRoute.value.path).toBe('/patients');
  });

  it('logoff (→ login) is never blocked — idle logoff must always win', async () => {
    const { router, guard } = await routedHarness();
    await router.push({ name: 'login' });
    expect(guard().confirmVisible.value).toBe(false);
    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('no unsaved edits → navigation is not interrupted', async () => {
    const { router, dirty, guard } = await routedHarness();
    dirty.value = false;
    await router.push('/patients');
    expect(guard().confirmVisible.value).toBe(false);
    expect(router.currentRoute.value.path).toBe('/patients');
  });
});

// ── 2. price-gap audit ───────────────────────────────────────────────────────

describe('findPriceGaps — WP-64', () => {
  it('lists, per specialty, the priced durations with no row and no default; default-only has none', () => {
    const gaps = findPriceGaps(SPECIALTIES);

    expect(gaps.map((g) => g.specialty.abbreviation)).toEqual(['TL', 'OT']); // sortOrder 1, 3; EEG absent
    expect(gaps[0].missingDurations).toEqual([45, 60, 90, 120]);
    expect(gaps[1].missingDurations).toEqual([30, 45, 60, 90, 120]);
  });
});

describe('SpecialtyPriceGapsPanel — WP-64', () => {
  it('renders one row per specialty with its missing durations; Set prices emits the specialty', async () => {
    const wrapper = mount(SpecialtyPriceGapsPanel, { props: { items: SPECIALTIES, canEditPrices: true } });

    const rows = wrapper.findAll('[data-testid="price-gap-row"]');
    expect(rows).toHaveLength(2);
    expect(rows[0].text()).toContain('TL');
    expect(rows[0].findAll('[data-testid="price-gap-duration"]').map((c) => c.text())).toEqual(['45 min', '60 min', '90 min', '120 min']);

    await rows[1].find('[data-testid="price-gap-set-prices"]').trigger('click');
    expect((wrapper.emitted('prices')![0][0] as LookupItem).id).toBe(OT);
  });

  it('hides Set prices without the price-edit claim', () => {
    const wrapper = mount(SpecialtyPriceGapsPanel, { props: { items: SPECIALTIES, canEditPrices: false } });
    expect(wrapper.find('[data-testid="price-gap-set-prices"]').exists()).toBe(false);
  });

  it('shows the all-clear when nothing is missing', () => {
    const wrapper = mount(SpecialtyPriceGapsPanel, { props: { items: SPECIALTIES.filter((x) => x.id === EEG) } });
    expect(wrapper.find('[data-testid="price-gaps-empty"]').exists()).toBe(true);
  });
});

describe('AdminView — Specialty Types › Price gaps tab', () => {
  const ADMIN_STUBS = {
    O2MobileNav: true, O2Sidebar: true, O2Header: true, O2Footer: true,
    AdminAccordionNav: true, SiteList: true, SiteFormModal: true,
    LookupTableManager: true, LookupFormModal: true, SpecialtyPricesModal: true,
    AboutPanel: true, PatientMergePanel: true,
  };

  it('badge counts specialties with gaps; the tab swaps the table for the audit', async () => {
    const wrapper = mount(AdminView, { global: { plugins: [authAs('MGR')], stubs: ADMIN_STUBS } });
    (wrapper.vm as unknown as { activeSection: string }).activeSection = 'specialty-types';
    await flushPromises();

    expect(wrapper.find('[data-testid="price-gaps-badge"]').text()).toBe('2');
    expect(wrapper.find('[data-testid="price-gaps-panel"]').exists()).toBe(false);

    await wrapper.find('[data-testid="specialty-tab-gaps"]').trigger('click');
    expect(wrapper.find('[data-testid="price-gaps-panel"]').exists()).toBe(true);
    expect(wrapper.findAll('[data-testid="price-gap-row"]')).toHaveLength(2);
  });
});
