// WP-37 (SEN-1/SEN-2) — SENADIS discount expiration date:
//   - PatientFormModal gains an expiration date input next to the SENADIS flag — shown only
//     while the flag is checked, disabled by the same Patients.SenadisDiscount.Edit claim gate
//     on edit (G4: one claim governs both fields; create stays free per SEN-2), with a
//     "SENADIS expired {date}" badge when the date is past (G3 — the flag is NEVER auto-cleared).
//   - BookingFormModal's 20% floor/min/clamp becomes expiry-aware (G2): it applies only when
//     the flag is on AND (no expiry OR the booking's SESSION date <= expiry). Flagged-but-
//     expired ⇒ no floor, no clamp-on-submit, badge instead. Boundary (session date == expiry)
//     still floors. Changing the session date across the expiry flips the behavior.
//   - SchedulePlanWizard's per-line clamp does the same against the schedule START date.
// Date determinism: fixtures use far-past (2020) / far-future (2099) expiries, and the
// boundary/flip cases drive form.sessionDate/startDate explicitly — no fake clock needed.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia, type Pinia } from 'pinia';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';
import type { ClaimDto } from '../interfaces/Auth';
import type { Patient } from '../interfaces/Patient';
import type { TreatmentPlan } from '../interfaces/TreatmentPlan';
import BookingFormModal from '../components/appointments/BookingFormModal.vue';
import PatientFormModal from '../components/patients/PatientFormModal.vue';
import SchedulePlanWizard from '../components/treatment-plans/SchedulePlanWizard.vue';
import { isSenadisExpired } from '../utils/senadis';

// ── fixtures ─────────────────────────────────────────────────────────────────

const NULL_EXPIRY_ID = 1; // flagged, no expiry (G1: open-ended)
const EXPIRED_ID = 2; // flagged, expired long ago
const FUTURE_ID = 3; // flagged, expires far in the future
const WINDOW_ID = 4; // flagged, fixed expiry for boundary/flip cases

const EXPIRY_BY_ID: Record<number, string | null> = {
  [NULL_EXPIRY_ID]: null,
  [EXPIRED_ID]: '2020-06-30T00:00:00',
  [FUTURE_ID]: '2099-12-31T00:00:00',
  [WINDOW_ID]: '2026-08-15T00:00:00',
};

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    patientId: NULL_EXPIRY_ID,
    userId: 10,
    patientName: 'Doe, John',
    medicalRecordNumber: 'MRN-001',
    cedula: null,
    dateOfBirth: '2015-01-15T00:00:00',
    email: 'john@example.com',
    phoneNumber: '555-0100',
    gender: 'Male',
    isActive: true,
    hasSenadisDiscount: false,
    senadisExpirationDate: null,
    hasCompletedDiscovery: true,
    createdTimestamp: '2025-01-01T00:00:00',
    caretakers: [],
    ...overrides,
  };
}

// ── mocks (every client the three components new up) ─────────────────────────

const { patientsClientMocks, lookupGetAllMock, createSessionMock, updatePatientMock, createPatientMock } = vi.hoisted(() => ({
  patientsClientMocks: {
    getPatient: vi.fn(),
    getPatientCaretakers: vi.fn(),
  },
  lookupGetAllMock: vi.fn(),
  createSessionMock: vi.fn().mockResolvedValue({}),
  updatePatientMock: vi.fn().mockResolvedValue(undefined),
  createPatientMock: vi.fn().mockResolvedValue({ patientId: 99, medicalRecordNumber: 'MRN-099' }),
}));

vi.mock('../services/PatientsHttpClient', () => ({
  PatientsHttpClient: vi.fn().mockImplementation(() => ({
    getPatient: patientsClientMocks.getPatient,
    getPatientCaretakers: patientsClientMocks.getPatientCaretakers,
    updatePatient: updatePatientMock,
    createPatient: createPatientMock,
  })),
}));

vi.mock('../services/TherapistsHttpClient', () => ({
  TherapistsHttpClient: vi.fn().mockImplementation(() => ({
    getTherapists: vi.fn().mockResolvedValue([
      { therapistId: 7, id: 7, therapistName: 'Therapist, Test', specialties: [] },
    ]),
  })),
}));

vi.mock('../services/LookupHttpClient', () => ({
  LookupHttpClient: vi.fn().mockImplementation(() => ({
    getAll: lookupGetAllMock,
  })),
}));

vi.mock('../services/SessionsHttpClient', () => ({
  SessionsHttpClient: vi.fn().mockImplementation(() => ({
    createSession: createSessionMock,
  })),
}));

vi.mock('../services/SitesHttpClient', () => ({
  SitesHttpClient: vi.fn().mockImplementation(() => ({
    getSites: vi.fn().mockResolvedValue([{ siteId: 1, siteName: 'Main' }]),
  })),
}));

vi.mock('../services/TreatmentPlansHttpClient', () => ({
  TreatmentPlansHttpClient: vi.fn().mockImplementation(() => ({
    schedule: vi.fn().mockResolvedValue({ planId: 1, sessionsCreated: 0, sessions: [], conflicts: [] }),
  })),
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
    userId: 1,
    email: 'test@example.com',
    fullName: 'Test User',
    mustChangePassword: false,
    roles: [role],
    claims: claimsForRole(role),
    isSystemAdmin: false,
  };
  return pinia;
}

beforeEach(() => {
  vi.clearAllMocks();
  createSessionMock.mockResolvedValue({});
  updatePatientMock.mockResolvedValue(undefined);
  createPatientMock.mockResolvedValue({ patientId: 99, medicalRecordNumber: 'MRN-099' });
  patientsClientMocks.getPatient.mockImplementation(async (id: number) =>
    patient({ patientId: id, hasSenadisDiscount: true, senadisExpirationDate: EXPIRY_BY_ID[id] ?? null }));
  patientsClientMocks.getPatientCaretakers.mockResolvedValue([
    { caretakerId: 1, caretakerName: 'Care, Cara', isPrimaryCaretaker: true, relationshipToPatient: 'Mother' },
  ]);
  lookupGetAllMock.mockResolvedValue([
    { id: 6, abbreviation: 'TL', name: 'Language Therapy', description: null, sortOrder: 1, defaultAmount: 65, createdTimestamp: '', lastUpdatedTimestamp: '' },
  ]);
});

// ── util predicate (G1/G2 truth table) ───────────────────────────────────────

describe('isSenadisExpired — G1/G2 predicate', () => {
  it('null/absent expiry never expires; boundary is NOT expired; strictly-earlier expiry is', () => {
    expect(isSenadisExpired(null, '2026-08-01')).toBe(false);
    expect(isSenadisExpired(undefined, '2026-08-01')).toBe(false);
    expect(isSenadisExpired('', '2026-08-01')).toBe(false);
    // API datetime vs date-input value — compared date-only
    expect(isSenadisExpired('2026-08-15T00:00:00', '2026-08-15')).toBe(false); // boundary floors
    expect(isSenadisExpired('2026-08-15T00:00:00', '2026-08-16')).toBe(true);
    expect(isSenadisExpired('2026-08-15T00:00:00', '2026-08-14')).toBe(false);
  });
});

// ── BookingFormModal — expiry-aware floor (G2) ───────────────────────────────

type BookingVm = {
  form: { patientId: number; sessionDate: string; amount: number; discount: number };
  senadisPatient: boolean;
  senadisActive: boolean;
  senadisFloor: number;
};

async function openBookingModal(pinia: Pinia) {
  const wrapper = mount(BookingFormModal, {
    props: { visible: false },
    global: { plugins: [pinia], stubs: { teleport: true } },
  });
  await wrapper.setProps({ visible: true });
  await flushPromises();
  return wrapper;
}

const badge = (wrapper: ReturnType<typeof mount>) =>
  wrapper.find('[data-testid="senadis-expired-badge"]'); // re-find after every change (teleport-stub gotcha)

describe('BookingFormModal — WP-37 expiry-aware SENADIS clamp', () => {
  it('null expiry: floor + clamp still apply (G1 open-ended), no badge', async () => {
    const wrapper = await openBookingModal(authAs('MGR'));
    const vm = wrapper.vm as unknown as BookingVm;

    vm.form.patientId = NULL_EXPIRY_ID;
    await flushPromises();
    vm.form.amount = 100;
    await flushPromises();

    expect(vm.senadisActive).toBe(true);
    expect(vm.senadisFloor).toBe(20);
    expect(vm.form.discount).toBe(20);
    expect(badge(wrapper).exists()).toBe(false);
  });

  it('future expiry: floor + toast apply, no badge', async () => {
    const pinia = authAs('MGR');
    const wrapper = await openBookingModal(pinia);
    const vm = wrapper.vm as unknown as BookingVm;
    const notifications = useNotificationsStore();

    vm.form.patientId = FUTURE_ID;
    await flushPromises();
    vm.form.amount = 100;
    await flushPromises();

    expect(vm.form.discount).toBe(20);
    expect(notifications.items.filter((n) => n.message.includes('SENADIS'))).toHaveLength(1);
    expect(badge(wrapper).exists()).toBe(false);
  });

  it('expired: NO floor, NO min, NO toast, NO clamp-on-submit — badge shown instead', async () => {
    const pinia = authAs('MGR');
    const wrapper = await openBookingModal(pinia);
    const vm = wrapper.vm as unknown as BookingVm;
    const notifications = useNotificationsStore();

    vm.form.patientId = EXPIRED_ID;
    await flushPromises();
    vm.form.amount = 100;
    vm.form.discount = 5;
    await flushPromises();

    expect(vm.senadisPatient).toBe(true); // flag stays on (G3 — never auto-cleared)
    expect(vm.senadisActive).toBe(false);
    expect(vm.senadisFloor).toBe(0);
    expect(vm.form.discount).toBe(5); // not clamped
    expect(notifications.items.filter((n) => n.message.includes('SENADIS'))).toHaveLength(0);
    expect(badge(wrapper).exists()).toBe(true);
    expect(badge(wrapper).text()).toContain('SENADIS expired Jun 30, 2020');

    // submit does NOT clamp an expired patient's discount; the requested value goes through
    (wrapper.vm as unknown as { handleSubmit: () => Promise<void> }).handleSubmit();
    await vi.waitFor(() => expect(createSessionMock).toHaveBeenCalled());
    expect(createSessionMock).toHaveBeenCalledWith(expect.objectContaining({ discount: 5 }));
  });

  it('boundary: session date == expiry still floors (G2: expired only when strictly past)', async () => {
    const wrapper = await openBookingModal(authAs('MGR'));
    const vm = wrapper.vm as unknown as BookingVm;

    vm.form.sessionDate = '2026-08-15'; // == WINDOW expiry
    vm.form.patientId = WINDOW_ID;
    await flushPromises();
    vm.form.amount = 100;
    await flushPromises();

    expect(vm.senadisActive).toBe(true);
    expect(vm.form.discount).toBe(20);
    expect(badge(wrapper).exists()).toBe(false);
  });

  it('changing the session date across the expiry flips floor/badge both ways', async () => {
    const wrapper = await openBookingModal(authAs('MGR'));
    const vm = wrapper.vm as unknown as BookingVm;

    vm.form.sessionDate = '2026-08-10'; // before expiry
    vm.form.patientId = WINDOW_ID;
    await flushPromises();
    vm.form.amount = 100;
    await flushPromises();
    expect(vm.form.discount).toBe(20); // clamped

    // cross past the expiry: floor lifts, badge appears, discount can go below 20%
    vm.form.sessionDate = '2026-08-20';
    await nextTick();
    expect(vm.senadisActive).toBe(false);
    expect(vm.senadisFloor).toBe(0);
    expect(badge(wrapper).exists()).toBe(true);
    vm.form.discount = 3;
    await nextTick();
    expect(vm.form.discount).toBe(3); // no re-clamp while expired

    // move back on/before the expiry: the clamp re-applies
    vm.form.sessionDate = '2026-08-15';
    await nextTick();
    expect(vm.senadisActive).toBe(true);
    expect(vm.form.discount).toBe(20);
    expect(badge(wrapper).exists()).toBe(false);
  });
});

// ── PatientFormModal — expiration field, gating, badge, payloads ─────────────

async function openPatientModal(pinia: Pinia, p: Patient | null) {
  const wrapper = mount(PatientFormModal, {
    props: { visible: false, patient: p },
    global: { plugins: [pinia], stubs: { teleport: true } },
  });
  await wrapper.setProps({ visible: true });
  return wrapper;
}

// First checkbox in the form is the SENADIS flag (WP-23 precedent).
const senadisCheckbox = (wrapper: ReturnType<typeof mount>) => wrapper.find('input[type="checkbox"]');
const expiryInput = (wrapper: ReturnType<typeof mount>) => wrapper.find('[data-testid="senadis-expiration-input"]');

describe('PatientFormModal — WP-37 expiration field', () => {
  it('hidden while the flag is off; appears (enabled) once checked on CREATE', async () => {
    const wrapper = await openPatientModal(authAs('FD'), null);

    expect(expiryInput(wrapper).exists()).toBe(false);
    await senadisCheckbox(wrapper).setValue(true);
    expect(expiryInput(wrapper).exists()).toBe(true);
    expect((expiryInput(wrapper).element as HTMLInputElement).disabled).toBe(false); // SEN-2: create stays free
  });

  it('EDIT claim gate mirrors the flag: FD disabled, MGR enabled (G4 — same claim)', async () => {
    const fd = await openPatientModal(authAs('FD'), patient({ hasSenadisDiscount: true, senadisExpirationDate: '2099-12-31T00:00:00' }));
    expect((expiryInput(fd).element as HTMLInputElement).disabled).toBe(true);

    const mgr = await openPatientModal(authAs('MGR'), patient({ hasSenadisDiscount: true, senadisExpirationDate: '2099-12-31T00:00:00' }));
    expect((expiryInput(mgr).element as HTMLInputElement).disabled).toBe(false);
  });

  it('badge: past expiry shows "SENADIS expired {date}"; future or null expiry does not', async () => {
    const past = await openPatientModal(authAs('MGR'), patient({ hasSenadisDiscount: true, senadisExpirationDate: '2020-06-30T00:00:00' }));
    expect(badge(past).exists()).toBe(true);
    expect(badge(past).text()).toContain('SENADIS expired Jun 30, 2020');
    // G3: the flag stays checked — expired is badge-only, never auto-cleared
    expect((senadisCheckbox(past).element as HTMLInputElement).checked).toBe(true);

    const future = await openPatientModal(authAs('MGR'), patient({ hasSenadisDiscount: true, senadisExpirationDate: '2099-12-31T00:00:00' }));
    expect(badge(future).exists()).toBe(false);

    const none = await openPatientModal(authAs('MGR'), patient({ hasSenadisDiscount: true, senadisExpirationDate: null }));
    expect(badge(none).exists()).toBe(false);
    expect((expiryInput(none).element as HTMLInputElement).value).toBe('');
  });

  it('MGR on EDIT: a set date is sent as T00:00:00 (echo keeps working); blank is omitted', async () => {
    const wrapper = await openPatientModal(authAs('MGR'), patient({ hasSenadisDiscount: true, senadisExpirationDate: null }));

    await expiryInput(wrapper).setValue('2027-06-30');
    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(updatePatientMock).toHaveBeenCalled());
    expect(updatePatientMock.mock.calls[0][1].senadisExpirationDate).toBe('2027-06-30T00:00:00');
  });

  it('MGR on EDIT with blank expiry: field omitted (omitted/null = unchanged server-side)', async () => {
    const wrapper = await openPatientModal(authAs('MGR'), patient({ hasSenadisDiscount: true, senadisExpirationDate: null }));

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(updatePatientMock).toHaveBeenCalled());
    expect(updatePatientMock.mock.calls[0][1].senadisExpirationDate).toBeUndefined();
  });

  it('FD on EDIT: payload omits the expiry (same omit-when-gated rule as the flag)', async () => {
    const wrapper = await openPatientModal(authAs('FD'), patient({ hasSenadisDiscount: true, senadisExpirationDate: '2027-06-30T00:00:00' }));

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(updatePatientMock).toHaveBeenCalled());
    expect(updatePatientMock.mock.calls[0][1].senadisExpirationDate).toBeUndefined();
    expect(updatePatientMock.mock.calls[0][1].hasSenadisDiscount).toBeUndefined();
  });

  it('FD on CREATE: flag + expiry both sent (SEN-2 — create is free for any creating role)', async () => {
    const wrapper = await openPatientModal(authAs('FD'), null);

    await senadisCheckbox(wrapper).setValue(true);
    // date inputs: [0] = DOB, [1] = SENADIS expiry (visible now the flag is on)
    const dates = wrapper.findAll('input[type="date"]');
    await dates[0].setValue('2015-01-15');
    await dates[1].setValue('2027-06-30');
    await wrapper.find('input[type="email"]').setValue('new@example.com');
    await wrapper.find('input[type="tel"]').setValue('555-0101');
    await wrapper.find('select').setValue('Male');
    const textInputs = wrapper.findAll('input[type="text"]');
    await textInputs[0].setValue('First');
    await textInputs[2].setValue('Last');
    await textInputs[3].setValue('001-0000001-1'); // cedula — required at create (WP-25)

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(createPatientMock).toHaveBeenCalled());
    expect(createPatientMock).toHaveBeenCalledWith(
      expect.objectContaining({ hasSenadisDiscount: true, senadisExpirationDate: '2027-06-30T00:00:00' })
    );
  });
});

// ── SchedulePlanWizard — expiry-aware per-line clamp (vs schedule START date) ─

function makePlan(patientId: number): TreatmentPlan {
  return {
    id: 11,
    patientId,
    patientName: 'Doe, John',
    displayTitle: 'Plan #11',
    planStatus: 'Active',
    weeklyFrequency: 1,
    durationWeeks: 2,
    lines: [
      {
        id: 1,
        specialtyAbbreviation: 'TL',
        duration: 60, // amount 65.00 ⇒ floor 13.00
        preferredTherapistId: null,
        dayOfWeek: 1,
        preferredTime: '09:00',
      },
    ],
  } as unknown as TreatmentPlan;
}

type WizardVm = {
  senadisPatient: boolean;
  senadisActive: boolean;
  senadisExpired: boolean;
  startDate: string;
  lineEdits: Array<{ discountAmount: number; discountPct: number }>;
};

async function openWizard(pinia: Pinia, patientId: number) {
  const wrapper = mount(SchedulePlanWizard, {
    props: { visible: false, plan: makePlan(patientId) },
    global: { plugins: [pinia], stubs: { teleport: true } },
  });
  await wrapper.setProps({ visible: true });
  await flushPromises();
  return wrapper;
}

describe('SchedulePlanWizard — WP-37 expiry-aware per-line clamp', () => {
  it('unexpired (far-future expiry): lines still initialize to the 20% floor', async () => {
    const wrapper = await openWizard(authAs('MGR'), FUTURE_ID);
    const vm = wrapper.vm as unknown as WizardVm;

    expect(vm.senadisActive).toBe(true);
    expect(vm.lineEdits[0].discountAmount).toBe(13);
    expect(vm.lineEdits[0].discountPct).toBe(20);
  });

  it('expired as of the schedule start date: no clamp, flag intact, badge state on', async () => {
    const wrapper = await openWizard(authAs('MGR'), EXPIRED_ID);
    const vm = wrapper.vm as unknown as WizardVm;

    expect(vm.senadisPatient).toBe(true); // G3 — flag never auto-cleared
    expect(vm.senadisActive).toBe(false);
    expect(vm.senadisExpired).toBe(true);
    expect(vm.lineEdits[0].discountAmount).toBe(0); // untouched
  });

  it('moving the start date across the expiry flips the clamp both ways', async () => {
    const wrapper = await openWizard(authAs('MGR'), WINDOW_ID); // expiry 2026-08-15
    const vm = wrapper.vm as unknown as WizardVm;

    vm.startDate = '2026-08-10'; // on/before expiry ⇒ clamp applies
    await nextTick();
    expect(vm.senadisActive).toBe(true);
    expect(vm.lineEdits[0].discountAmount).toBe(13);

    vm.startDate = '2026-08-20'; // past expiry ⇒ min lifts; user may lower the discount
    await nextTick();
    expect(vm.senadisActive).toBe(false);
    vm.lineEdits[0].discountAmount = 0;
    await nextTick();
    expect(vm.lineEdits[0].discountAmount).toBe(0); // no re-clamp while expired

    vm.startDate = '2026-08-15'; // boundary ⇒ active again, watcher re-clamps
    await nextTick();
    expect(vm.senadisActive).toBe(true);
    expect(vm.lineEdits[0].discountAmount).toBe(13);
  });
});
