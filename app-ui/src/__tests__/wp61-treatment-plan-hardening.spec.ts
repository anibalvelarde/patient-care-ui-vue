// WP-61 (E2E F-7 / F-8) — treatment-plan hardening, UI side.
//   - plan-line duration is a select of the bookable durations (40 can't be entered);
//   - owner ruling 2026-11-14: a line with no price (no duration row AND no default) → a toast naming it
//     and save / activate / schedule are blocked;
//   - the creator is the discovery session's therapist (shown read-only, never sent);
//   - an Active plan stays editable until it is scheduled (Edit gated on `canEditLines`), and lines
//     carry their id back so the API updates them in place;
//   - wizard step 2 shows the real price read-only; no discount is sent.
// Synthetic data only.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createPinia, setActivePinia, type Pinia } from 'pinia';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';
import type { ClaimDto } from '../interfaces/Auth';
import type { TreatmentPlan, TreatmentPlanLine, DiscoverySessionSummary } from '../interfaces/TreatmentPlan';
import type { LookupItem } from '../interfaces/Lookups';
import { BOOKABLE_DURATIONS } from '../constants/durations';
import TreatmentPlanFormModal from '../components/treatment-plans/TreatmentPlanFormModal.vue';
import TreatmentPlanList from '../components/treatment-plans/TreatmentPlanList.vue';
import SchedulePlanWizard from '../components/treatment-plans/SchedulePlanWizard.vue';

const { plansMocks, lookupGetAllMock, therapistsMocks, sessionsMocks, sitesMocks, patientsMocks } = vi.hoisted(() => ({
  plansMocks: { create: vi.fn(), update: vi.fn(), activate: vi.fn(), schedule: vi.fn(), getProgress: vi.fn() },
  lookupGetAllMock: vi.fn(),
  therapistsMocks: { getTherapists: vi.fn() },
  sessionsMocks: { getDiscoverySessions: vi.fn() },
  sitesMocks: { getSites: vi.fn() },
  patientsMocks: { getPatient: vi.fn(), getPatientCaretakers: vi.fn() },
}));

vi.mock('../services/TreatmentPlansHttpClient', () => ({
  TreatmentPlansHttpClient: vi.fn().mockImplementation(() => ({ ...plansMocks })),
}));
vi.mock('../services/LookupHttpClient', () => ({
  LookupHttpClient: vi.fn().mockImplementation(() => ({ getAll: lookupGetAllMock })),
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
  const store = useAuthStore();
  store.user = {
    userId: 1, email: 'test@example.com', fullName: 'Test User',
    mustChangePassword: false, roles: [role], claims: claimsForRole(role),
    isSystemAdmin: false,
  };
  return pinia;
}

// ── factories ────────────────────────────────────────────────────────────────

const TL = 6;   // 30-min price row only, no default
const EEG = 15; // default only

function specialty(overrides: Partial<LookupItem> = {}): LookupItem {
  return {
    id: TL, abbreviation: 'TL', name: 'Language Therapy', description: null, sortOrder: 1,
    defaultAmount: null, durationPrices: [], createdTimestamp: '', lastUpdatedTimestamp: '', ...overrides,
  };
}

const SPECIALTIES: LookupItem[] = [
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

type FormVm = { lines: Array<{ id: number | null; specialtyTypeId: number; duration: number }> };

async function openForm(pinia: Pinia, p: TreatmentPlan | null) {
  const wrapper = mount(TreatmentPlanFormModal, {
    props: { visible: false, plan: p, patientId: 921 },
    global: { plugins: [pinia], stubs: { teleport: true } },
  });
  await wrapper.setProps({ visible: true });
  await flushPromises();
  return wrapper;
}

const toasts = () => useNotificationsStore().items.map((n) => n.message).join(' | ');

beforeEach(() => {
  vi.clearAllMocks();
  lookupGetAllMock.mockResolvedValue(SPECIALTIES);
  therapistsMocks.getTherapists.mockResolvedValue([]);
  sessionsMocks.getDiscoverySessions.mockResolvedValue([discovery()]);
  plansMocks.create.mockResolvedValue(plan());
  plansMocks.update.mockResolvedValue(plan());
  plansMocks.activate.mockResolvedValue(plan({ planStatus: 'Active' }));
  plansMocks.schedule.mockResolvedValue({ planId: 6, sessionsCreated: 4, sessions: [], conflicts: [] });
  plansMocks.getProgress.mockResolvedValue(null);
  sitesMocks.getSites.mockResolvedValue([{ siteId: 1, siteName: 'Main' }]);
  patientsMocks.getPatient.mockResolvedValue({ patientId: 921, hasSenadisDiscount: false });
  patientsMocks.getPatientCaretakers.mockResolvedValue([{ caretakerId: 1 }]);
});

// ── plan form ────────────────────────────────────────────────────────────────

describe('TreatmentPlanFormModal — WP-61', () => {
  it('duration is a select of exactly the bookable durations', async () => {
    const wrapper = await openForm(authAs('MGR'), null);

    const options = wrapper.find('[data-testid="line-duration-select"]').findAll('option').map((o) => Number(o.element.value));
    expect(options).toEqual([...BOOKABLE_DURATIONS]);
  });

  it('shows the discovery therapist as the creator and never sends createdByTherapistId', async () => {
    const wrapper = await openForm(authAs('MGR'), null);
    expect(wrapper.find('[data-testid="plan-created-by"]').text()).toContain('Synthetic, Nine');

    const vm = wrapper.vm as unknown as FormVm;
    vm.lines[0].specialtyTypeId = TL;
    vm.lines[0].duration = 30;
    await nextTick();
    await wrapper.find('[data-testid="plan-save-create"]').trigger('click');
    await flushPromises();

    expect(plansMocks.create).toHaveBeenCalledTimes(1);
    expect(plansMocks.create.mock.calls[0][0]).not.toHaveProperty('createdByTherapistId');
  });

  it('owner ruling: a line with no price → toast naming it, inline hint, and save is blocked', async () => {
    const wrapper = await openForm(authAs('MGR'), null);
    const vm = wrapper.vm as unknown as FormVm;
    vm.lines[0].specialtyTypeId = TL; // TL has no 60-min row and no default
    vm.lines[0].duration = 60;
    await nextTick();

    expect(wrapper.find('[data-testid="line-missing-price"]').text()).toContain('Language Therapy at 60 min');
    await wrapper.find('[data-testid="plan-save-create"]').trigger('click');
    await flushPromises();

    expect(plansMocks.create).not.toHaveBeenCalled();
    expect(toasts()).toContain('No price for Language Therapy at 60 min');
  });

  it('a default-only specialty is fine at any bookable duration', async () => {
    const wrapper = await openForm(authAs('MGR'), null);
    const vm = wrapper.vm as unknown as FormVm;
    vm.lines[0].specialtyTypeId = EEG;
    vm.lines[0].duration = 90;
    await nextTick();

    expect(wrapper.find('[data-testid="line-missing-price"]').exists()).toBe(false);
    await wrapper.find('[data-testid="plan-save-create"]').trigger('click');
    await flushPromises();
    expect(plansMocks.create).toHaveBeenCalledTimes(1);
  });

  it('a stored non-bookable duration (legacy 40) is shown marked and blocks save', async () => {
    const wrapper = await openForm(authAs('MGR'), plan({ lines: [line({ duration: 40 })] }));

    expect(wrapper.find('[data-testid="line-duration-select"]').text()).toContain('40 (not bookable)');
    expect(wrapper.find('[data-testid="line-missing-price"]').text()).toContain('40 min is not bookable');
    await wrapper.find('[data-testid="plan-save-edit"]').trigger('click');
    await flushPromises();
    expect(plansMocks.update).not.toHaveBeenCalled();
  });

  it('activation is blocked the same way', async () => {
    const wrapper = await openForm(authAs('MGR'), plan({ lines: [line({ duration: 60 })] }));

    await wrapper.find('[data-testid="plan-activate"]').trigger('click');
    await flushPromises();

    expect(plansMocks.activate).not.toHaveBeenCalled();
    expect(toasts()).toContain('No price for Language Therapy at 60 min');
  });

  it('Active plan not yet scheduled: editable, and lines go back with their ids', async () => {
    const wrapper = await openForm(authAs('MGR'), plan({ planStatus: 'Active', canEditLines: true }));

    const save = wrapper.find('[data-testid="plan-save-edit"]');
    expect(save.text()).toBe('Save Changes');
    await save.trigger('click');
    await flushPromises();

    expect(plansMocks.update).toHaveBeenCalledTimes(1);
    const [id, request] = plansMocks.update.mock.calls[0];
    expect(id).toBe(6);
    expect(request.lines[0].id).toBe(13);
  });

  it('Active plan already scheduled (canEditLines false): no save button', async () => {
    const wrapper = await openForm(authAs('MGR'), plan({ planStatus: 'Active', canEditLines: false }));

    expect(wrapper.find('[data-testid="plan-save-edit"]').exists()).toBe(false);
  });
});

// ── plan list ────────────────────────────────────────────────────────────────

describe('TreatmentPlanList — WP-61 Edit gating', () => {
  async function editButtonFor(p: TreatmentPlan) {
    const wrapper = mount(TreatmentPlanList, {
      props: { plans: [p] },
      global: { plugins: [authAs('MGR')], stubs: { PlanProgressCard: true } },
    });
    await flushPromises();
    return wrapper.find('[data-testid="plan-edit-button"]');
  }

  it('Active + canEditLines → Edit shown', async () => {
    expect((await editButtonFor(plan({ planStatus: 'Active', canEditLines: true }))).exists()).toBe(true);
  });

  it('Active + already scheduled → Edit hidden', async () => {
    expect((await editButtonFor(plan({ planStatus: 'Active', canEditLines: false }))).exists()).toBe(false);
  });

  it('Draft → Edit shown', async () => {
    expect((await editButtonFor(plan())).exists()).toBe(true);
  });
});

// ── scheduling wizard ────────────────────────────────────────────────────────

type WizardVm = { step: number; startDate: string; siteId: number };

async function openWizard(p: TreatmentPlan) {
  const wrapper = mount(SchedulePlanWizard, {
    props: { visible: false, plan: p },
    global: { plugins: [authAs('MGR')], stubs: { teleport: true } },
  });
  await wrapper.setProps({ visible: true });
  await flushPromises();
  const vm = wrapper.vm as unknown as WizardVm;
  vm.siteId = 1;
  vm.step = 2;
  await nextTick();
  return wrapper;
}

describe('SchedulePlanWizard — WP-61', () => {
  it('step 2 shows the real price-sheet amount (not the old $65/hour)', async () => {
    const wrapper = await openWizard(plan({ planStatus: 'Active' })); // TL 30 → $50.00

    expect(wrapper.find('[data-testid="line-amount"]').text()).toContain('50.00');
    expect(wrapper.find('[data-testid="line-estimate"]').text()).toContain('Estimate — final amounts in step 3');
  });

  it('sends no discountAmount override', async () => {
    const wrapper = await openWizard(plan({ planStatus: 'Active' }));

    await wrapper.find('[data-testid="wizard-schedule-button"]').trigger('click');
    await flushPromises();

    expect(plansMocks.schedule).toHaveBeenCalledTimes(1);
    const overrides = plansMocks.schedule.mock.calls[0][1].lineOverrides;
    expect(overrides[0]).not.toHaveProperty('discountAmount');
  });

  it('owner ruling: a line with no price → toast on open, block banner, and Schedule disabled', async () => {
    const wrapper = await openWizard(plan({ planStatus: 'Active', lines: [line({ duration: 60 })] }));

    expect(toasts()).toContain('No price for Language Therapy at 60 min');
    expect(wrapper.find('[data-testid="wizard-missing-price-block"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="line-missing-price"]').exists()).toBe(true);
    expect((wrapper.find('[data-testid="wizard-schedule-button"]').element as HTMLButtonElement).disabled).toBe(true);
  });
});
