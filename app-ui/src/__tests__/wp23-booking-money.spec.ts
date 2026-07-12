// WP-23 (F6/F7/F10) — booking money pack:
//   F6  — Admin gains a per-type "Default $" column/field for specialty-types only; the
//         booking modal pre-fills Amount from the selected specialty's defaultAmount.
//   F7  — SENADIS patients get a 20%-of-Amount discount floor at booking (one info toast per
//         patient selection); the Patient form's flag checkbox is claim-gated on edit.
//   F10 — booking is hard-blocked (modal + plan wizard) when the patient has no caretaker.

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
import AdminView from '../views/AdminView.vue';

// ── shared mocks ─────────────────────────────────────────────────────────────

const FLAGGED_ID = 1;
const UNFLAGGED_ID = 2;
const CARETAKERLESS_ID = 3;

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    patientId: FLAGGED_ID,
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
    hasCompletedDiscovery: true,
    createdTimestamp: '2025-01-01T00:00:00',
    caretakers: [],
    ...overrides,
  };
}

const { patientsClientMocks, lookupGetAllMock, createSessionMock, updatePatientMock, createPatientMock } = vi.hoisted(() => ({
  patientsClientMocks: {
    getPatients: vi.fn(),
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
    getPatients: patientsClientMocks.getPatients,
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
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue(undefined),
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
  patientsClientMocks.getPatients.mockResolvedValue([
    patient({ patientId: FLAGGED_ID, patientName: 'Flagged, Fay', hasSenadisDiscount: true }),
    patient({ patientId: UNFLAGGED_ID, patientName: 'Plain, Pete' }),
    patient({ patientId: CARETAKERLESS_ID, patientName: 'Alone, Al' }),
  ]);
  patientsClientMocks.getPatient.mockImplementation(async (id: number) =>
    patient({ patientId: id, hasSenadisDiscount: id === FLAGGED_ID }));
  patientsClientMocks.getPatientCaretakers.mockImplementation(async (id: number) =>
    id === CARETAKERLESS_ID
      ? []
      : [{ caretakerId: 1, caretakerName: 'Care, Cara', isPrimaryCaretaker: true, relationshipToPatient: 'Mother' }]);
  lookupGetAllMock.mockResolvedValue([
    { id: 6, abbreviation: 'TL', name: 'Language Therapy', description: null, sortOrder: 1, defaultAmount: 65, createdTimestamp: '', lastUpdatedTimestamp: '' },
    { id: 2, abbreviation: 'FS', name: 'Physiotherapy', description: null, sortOrder: 2, defaultAmount: null, createdTimestamp: '', lastUpdatedTimestamp: '' },
  ]);
});

// ── BookingFormModal ─────────────────────────────────────────────────────────

type BookingVm = {
  form: { patientId: number; specialtyTypeId: number; amount: number; discount: number };
  senadisPatient: boolean;
  senadisFloor: number;
  caretakerWarning: boolean;
  isValid: boolean;
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

describe('BookingFormModal — F6 default-price pre-fill', () => {
  it('pre-fills Amount from the specialty defaultAmount and refills on change', async () => {
    const wrapper = await openBookingModal(authAs('MGR'));
    const vm = wrapper.vm as unknown as BookingVm;

    vm.form.specialtyTypeId = 6; // TL, defaultAmount 65
    await flushPromises();
    expect(vm.form.amount).toBe(65);

    // NULL default leaves the amount alone (user may have typed one already)
    vm.form.amount = 42;
    vm.form.specialtyTypeId = 2; // FS, defaultAmount null
    await flushPromises();
    expect(vm.form.amount).toBe(42);
  });
});

describe('BookingFormModal — F7 SENADIS floor + toast', () => {
  it('flags the patient, toasts once, and clamps the discount to 20% of amount', async () => {
    const pinia = authAs('MGR');
    const wrapper = await openBookingModal(pinia);
    const vm = wrapper.vm as unknown as BookingVm;
    const notifications = useNotificationsStore();

    vm.form.patientId = FLAGGED_ID;
    await flushPromises();

    expect(vm.senadisPatient).toBe(true);
    const senadisToasts = notifications.items.filter((n) => n.message.includes('SENADIS'));
    expect(senadisToasts).toHaveLength(1);

    vm.form.amount = 100;
    await flushPromises();
    expect(vm.senadisFloor).toBe(20);
    expect(vm.form.discount).toBe(20); // re-clamped when the amount moved the floor

    // submit clamps a below-floor discount before sending; server floors too
    vm.form.discount = 5;
    (wrapper.vm as unknown as { handleSubmit: () => Promise<void> }).handleSubmit();
    await flushPromises();
    expect(createSessionMock).toHaveBeenCalledWith(expect.objectContaining({ discount: 20 }));
  });

  it('leaves unflagged patients untouched', async () => {
    const wrapper = await openBookingModal(authAs('MGR'));
    const vm = wrapper.vm as unknown as BookingVm;

    vm.form.patientId = UNFLAGGED_ID;
    await flushPromises();
    vm.form.amount = 100;
    vm.form.discount = 5;
    await flushPromises();

    expect(vm.senadisPatient).toBe(false);
    expect(vm.form.discount).toBe(5);
  });
});

describe('BookingFormModal — F10 caretaker hard block', () => {
  it('blocks submit and shows the red blocker for a caretaker-less patient', async () => {
    const wrapper = await openBookingModal(authAs('MGR'));
    const vm = wrapper.vm as unknown as BookingVm;

    vm.form.patientId = CARETAKERLESS_ID;
    await flushPromises();

    expect(vm.caretakerWarning).toBe(true);
    expect(wrapper.text()).toContain('Booking blocked');
    // even with everything else selected, the form stays invalid
    vm.form.specialtyTypeId = 6;
    (wrapper.vm as unknown as { form: { therapistId: number } }).form.therapistId = 7;
    await nextTick();
    expect(vm.isValid).toBe(false);
  });
});

// ── SchedulePlanWizard ───────────────────────────────────────────────────────

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
  caretakerBlocked: boolean;
  senadisPatient: boolean;
  canProceedStep1: boolean;
  startDate: string;
  siteId: number;
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

describe('SchedulePlanWizard — WP-23', () => {
  it('F10: blocks step 1 with a banner when the patient has no caretaker', async () => {
    const wrapper = await openWizard(authAs('MGR'), CARETAKERLESS_ID);
    const vm = wrapper.vm as unknown as WizardVm;

    expect(vm.caretakerBlocked).toBe(true);
    expect(wrapper.text()).toContain('Scheduling blocked');
    vm.startDate = '2026-07-20';
    vm.siteId = 1;
    await nextTick();
    expect(vm.canProceedStep1).toBe(false);
  });

  it('F7: initializes each line discount to the 20% floor for SENADIS patients', async () => {
    const wrapper = await openWizard(authAs('MGR'), FLAGGED_ID);
    const vm = wrapper.vm as unknown as WizardVm;

    expect(vm.senadisPatient).toBe(true);
    expect(vm.caretakerBlocked).toBe(false);
    expect(vm.lineEdits[0].discountAmount).toBe(13); // 20% of the 65.00 line amount
    expect(vm.lineEdits[0].discountPct).toBe(20);
  });

  it('leaves lines untouched for unflagged patients', async () => {
    const wrapper = await openWizard(authAs('MGR'), UNFLAGGED_ID);
    const vm = wrapper.vm as unknown as WizardVm;

    expect(vm.senadisPatient).toBe(false);
    expect(vm.lineEdits[0].discountAmount).toBe(0);
  });
});

// ── PatientFormModal — F7 claim-gated checkbox ───────────────────────────────

async function openPatientModal(pinia: Pinia, p: Patient | null) {
  const wrapper = mount(PatientFormModal, {
    props: { visible: false, patient: p },
    global: { plugins: [pinia], stubs: { teleport: true } },
  });
  await wrapper.setProps({ visible: true });
  return wrapper;
}

const senadisCheckbox = (wrapper: ReturnType<typeof mount>) =>
  wrapper.find('input[type="checkbox"]');

describe('PatientFormModal — F7 SENADIS checkbox claim gating', () => {
  it('FD on EDIT: checkbox disabled and the payload omits the field', async () => {
    const wrapper = await openPatientModal(authAs('FD'), patient({ hasSenadisDiscount: true }));

    expect((senadisCheckbox(wrapper).element as HTMLInputElement).disabled).toBe(true);
    expect(wrapper.text()).toContain('Only Managers / Assistant Managers');

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(updatePatientMock).toHaveBeenCalled());
    expect(updatePatientMock.mock.calls[0][1].hasSenadisDiscount).toBeUndefined();
  });

  it('MGR on EDIT: checkbox enabled and the changed value is sent', async () => {
    const wrapper = await openPatientModal(authAs('MGR'), patient({ hasSenadisDiscount: false }));

    const checkbox = senadisCheckbox(wrapper);
    expect((checkbox.element as HTMLInputElement).disabled).toBe(false);
    await checkbox.setValue(true);

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(updatePatientMock).toHaveBeenCalled());
    expect(updatePatientMock).toHaveBeenCalledWith(
      FLAGGED_ID,
      expect.objectContaining({ hasSenadisDiscount: true })
    );
  });

  it('FD on CREATE: checkbox enabled (Questionnaire E gates edits only) and value sent', async () => {
    const wrapper = await openPatientModal(authAs('FD'), null);

    const checkbox = senadisCheckbox(wrapper);
    expect((checkbox.element as HTMLInputElement).disabled).toBe(false);
    await checkbox.setValue(true);

    await wrapper.find('input[type="email"]').setValue('new@example.com');
    await wrapper.find('input[type="tel"]').setValue('555-0101');
    await wrapper.find('input[type="date"]').setValue('2015-01-15');
    await wrapper.find('select').setValue('Male');
    const textInputs = wrapper.findAll('input[type="text"]');
    await textInputs[0].setValue('First');
    await textInputs[2].setValue('Last');

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(createPatientMock).toHaveBeenCalled());
    expect(createPatientMock).toHaveBeenCalledWith(
      expect.objectContaining({ hasSenadisDiscount: true })
    );
  });
});

// ── AdminView — F6 per-type lookup column ────────────────────────────────────

describe('AdminView — F6 per-type Default $ column', () => {
  async function mountAdmin(pinia: Pinia, section: string) {
    const wrapper = mount(AdminView, {
      global: {
        plugins: [pinia],
        stubs: {
          O2MobileNav: true, O2Sidebar: true, O2Header: true, O2Footer: true,
          AdminAccordionNav: true, SiteList: true, SiteFormModal: true,
          LookupTableManager: true, LookupFormModal: true, AboutPanel: true,
          PatientMergePanel: true,
        },
      },
    });
    (wrapper.vm as unknown as { activeSection: string }).activeSection = section;
    await nextTick();
    return wrapper;
  }

  it('specialty-types table gains the Default $ column', async () => {
    const wrapper = await mountAdmin(authAs('SYSADMIN'), 'specialty-types');
    const manager = wrapper.findComponent({ name: 'LookupTableManager' });
    const keys = (manager.props('columns') as Array<{ key: string }>).map((c) => c.key);
    expect(keys).toContain('defaultAmount');
  });

  it('other lookup tables keep the base 4 columns', async () => {
    const wrapper = await mountAdmin(authAs('SYSADMIN'), 'payment-types');
    const manager = wrapper.findComponent({ name: 'LookupTableManager' });
    const keys = (manager.props('columns') as Array<{ key: string }>).map((c) => c.key);
    expect(keys).not.toContain('defaultAmount');
    expect(keys).toHaveLength(4);
  });
});
