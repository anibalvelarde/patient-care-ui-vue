// WP-24 (F3/F4) — patient "requires discovery" waiver:
//   F3 — PatientFormModal gains a "Requires discovery session" checkbox, default CHECKED at
//        create; free at create for any patient-creating role, claim-gated on edit
//        (Patients.RequiresDiscovery.Edit, MGR/AM only — SENADIS-pattern field gate).
//   F4 — BookingFormModal waives the discovery-first rule when requiresDiscovery === false
//        (legacy imports): no amber banner, specialty list unfiltered. Absent/undefined
//        (older API) still reads as "discovery required".

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia, type Pinia } from 'pinia';
import { mount, flushPromises } from '@vue/test-utils';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import type { Patient } from '../interfaces/Patient';
import BookingFormModal from '../components/appointments/BookingFormModal.vue';
import PatientFormModal from '../components/patients/PatientFormModal.vue';

// ── shared mocks (wp23-booking-money.spec.ts pattern) ────────────────────────

const PATIENT_ID = 1;

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    patientId: PATIENT_ID,
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
    requiresDiscovery: true,
    hasCompletedDiscovery: true,
    createdTimestamp: '2025-01-01T00:00:00',
    caretakers: [],
    ...overrides,
  };
}

const { patientsClientMocks, lookupGetAllMock, updatePatientMock, createPatientMock } = vi.hoisted(() => ({
  patientsClientMocks: {
    getPatients: vi.fn(),
    getPatient: vi.fn(),
    getPatientCaretakers: vi.fn(),
  },
  lookupGetAllMock: vi.fn(),
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
  })),
}));

vi.mock('../services/SessionsHttpClient', () => ({
  SessionsHttpClient: vi.fn().mockImplementation(() => ({
    createSession: vi.fn().mockResolvedValue({}),
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
  patientsClientMocks.getPatients.mockResolvedValue([patient()]);
  patientsClientMocks.getPatient.mockResolvedValue(patient());
  patientsClientMocks.getPatientCaretakers.mockResolvedValue([
    { caretakerId: 1, caretakerName: 'Care, Cara', isPrimaryCaretaker: true, relationshipToPatient: 'Mother' },
  ]);
  lookupGetAllMock.mockResolvedValue([
    { id: 1, abbreviation: 'Eval-TL', name: 'Discovery Evaluation', description: null, sortOrder: 1, defaultAmount: null, createdTimestamp: '', lastUpdatedTimestamp: '' },
    { id: 6, abbreviation: 'TL', name: 'Language Therapy', description: null, sortOrder: 2, defaultAmount: null, createdTimestamp: '', lastUpdatedTimestamp: '' },
    { id: 2, abbreviation: 'FS', name: 'Physiotherapy', description: null, sortOrder: 3, defaultAmount: null, createdTimestamp: '', lastUpdatedTimestamp: '' },
  ]);
});

// ── PatientFormModal — F3 claim-gated waiver checkbox ────────────────────────

async function openPatientModal(pinia: Pinia, p: Patient | null) {
  const wrapper = mount(PatientFormModal, {
    props: { visible: false, patient: p },
    global: { plugins: [pinia], stubs: { teleport: true } },
  });
  await wrapper.setProps({ visible: true });
  return wrapper;
}

const rdCheckbox = (wrapper: ReturnType<typeof mount>) =>
  wrapper.find('[data-testid="requires-discovery-checkbox"]');

describe('PatientFormModal — F3 requires-discovery checkbox claim gating', () => {
  it('FD on EDIT: checkbox disabled and the update payload omits the field', async () => {
    const wrapper = await openPatientModal(authAs('FD'), patient({ requiresDiscovery: false }));

    expect((rdCheckbox(wrapper).element as HTMLInputElement).disabled).toBe(true);
    expect(wrapper.text()).toContain('Only Managers / Assistant Managers can change this after creation.');

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(updatePatientMock).toHaveBeenCalled());
    expect(updatePatientMock.mock.calls[0][1].requiresDiscovery).toBeUndefined();
  });

  it('MGR on EDIT: checkbox enabled and the changed value is sent', async () => {
    const wrapper = await openPatientModal(authAs('MGR'), patient({ requiresDiscovery: true }));

    const checkbox = rdCheckbox(wrapper);
    expect((checkbox.element as HTMLInputElement).disabled).toBe(false);
    expect((checkbox.element as HTMLInputElement).checked).toBe(true);
    await checkbox.setValue(false); // waive the discovery-first rule

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(updatePatientMock).toHaveBeenCalled());
    expect(updatePatientMock).toHaveBeenCalledWith(
      PATIENT_ID,
      expect.objectContaining({ requiresDiscovery: false })
    );
  });

  it('EDIT hydration: undefined (older API) reads as true', async () => {
    const wrapper = await openPatientModal(authAs('MGR'), patient({ requiresDiscovery: undefined }));
    expect((rdCheckbox(wrapper).element as HTMLInputElement).checked).toBe(true);
  });

  async function fillRequiredCreateFields(wrapper: ReturnType<typeof mount>) {
    await wrapper.find('input[type="email"]').setValue('new@example.com');
    await wrapper.find('input[type="tel"]').setValue('555-0101');
    await wrapper.find('input[type="date"]').setValue('2015-01-15');
    await wrapper.find('select').setValue('Male');
    const textInputs = wrapper.findAll('input[type="text"]');
    await textInputs[0].setValue('First');
    await textInputs[2].setValue('Last');
  }

  it('FD on CREATE: checkbox enabled, default CHECKED, and true sent when untouched', async () => {
    const wrapper = await openPatientModal(authAs('FD'), null);

    const checkbox = rdCheckbox(wrapper);
    expect((checkbox.element as HTMLInputElement).disabled).toBe(false);
    expect((checkbox.element as HTMLInputElement).checked).toBe(true); // default at create

    await fillRequiredCreateFields(wrapper);
    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(createPatientMock).toHaveBeenCalled());
    expect(createPatientMock).toHaveBeenCalledWith(
      expect.objectContaining({ requiresDiscovery: true })
    );
  });

  it('FD on CREATE: unchecking sends false (Questionnaire C — waivable at create)', async () => {
    const wrapper = await openPatientModal(authAs('FD'), null);

    await rdCheckbox(wrapper).setValue(false);
    await fillRequiredCreateFields(wrapper);
    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(createPatientMock).toHaveBeenCalled());
    expect(createPatientMock).toHaveBeenCalledWith(
      expect.objectContaining({ requiresDiscovery: false })
    );
  });
});

// ── BookingFormModal — F4 discovery-first waiver ─────────────────────────────

type BookingVm = {
  form: { patientId: number };
  needsDiscovery: boolean;
  filteredSpecialties: Array<{ abbreviation: string }>;
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

async function selectPatient(wrapper: Awaited<ReturnType<typeof openBookingModal>>, p: Patient) {
  patientsClientMocks.getPatient.mockResolvedValue(p);
  (wrapper.vm as unknown as BookingVm).form.patientId = p.patientId;
  await flushPromises();
}

describe('BookingFormModal — F4 requires-discovery waiver', () => {
  it('waived patient (requiresDiscovery=false, no completed discovery): no banner, specialties unfiltered', async () => {
    const wrapper = await openBookingModal(authAs('MGR'));
    await selectPatient(wrapper, patient({ requiresDiscovery: false, hasCompletedDiscovery: false }));

    const vm = wrapper.vm as unknown as BookingVm;
    expect(vm.needsDiscovery).toBe(false);
    expect(wrapper.text()).not.toContain('needs a discovery session');
    expect(vm.filteredSpecialties.map((s) => s.abbreviation)).toEqual(['Eval-TL', 'TL', 'FS']);
  });

  it('unwaived patient (requiresDiscovery=true, no completed discovery): banner + discovery-only specialties', async () => {
    const wrapper = await openBookingModal(authAs('MGR'));
    await selectPatient(wrapper, patient({ requiresDiscovery: true, hasCompletedDiscovery: false }));

    const vm = wrapper.vm as unknown as BookingVm;
    expect(vm.needsDiscovery).toBe(true);
    expect(wrapper.text()).toContain('This patient needs a discovery session first.');
    expect(vm.filteredSpecialties.map((s) => s.abbreviation)).toEqual(['Eval-TL']);
  });

  it('absent flag (older API) still requires discovery', async () => {
    const wrapper = await openBookingModal(authAs('MGR'));
    await selectPatient(wrapper, patient({ requiresDiscovery: undefined, hasCompletedDiscovery: false }));

    const vm = wrapper.vm as unknown as BookingVm;
    expect(vm.needsDiscovery).toBe(true);
    expect(wrapper.text()).toContain('This patient needs a discovery session first.');
  });

  it('completed discovery still clears the banner regardless of the flag', async () => {
    const wrapper = await openBookingModal(authAs('MGR'));
    await selectPatient(wrapper, patient({ requiresDiscovery: true, hasCompletedDiscovery: true }));

    expect((wrapper.vm as unknown as BookingVm).needsDiscovery).toBe(false);
  });
});
