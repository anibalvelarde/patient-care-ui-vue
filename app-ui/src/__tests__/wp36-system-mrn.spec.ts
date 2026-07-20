// WP-36C (NP-1) — system-managed MRN:
//   The server ALWAYS mints NC{yy}-#### at create (client-supplied MRN would be ignored), the
//   create response carries the minted value, and patients are ACTIVE at create. The UI:
//   - create form has NO MRN input — a read-only "assigned automatically" note instead;
//   - the create payload carries no medicalRecordNumber key at all;
//   - PatientsView surfaces the minted MRN in a success banner so FD can note the chart number;
//   - edit-modal MRN behavior is unchanged (B2: editable, duplicate → 409).
//   The TEMP-/inactive-until-MRN flow is retired (prod had zero TEMP- rows).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia, type Pinia } from 'pinia';
import { mount, flushPromises } from '@vue/test-utils';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import type { Patient } from '../interfaces/Patient';
import type { PagedResult } from '../interfaces/SessionHistory';
import PatientFormModal from '../components/patients/PatientFormModal.vue';
import PatientsView from '../views/PatientsView.vue';

const { createPatientMock, updatePatientMock, getPatientsMock, getPastDuePatientsMock } = vi.hoisted(() => ({
  createPatientMock: vi.fn(),
  updatePatientMock: vi.fn(),
  getPatientsMock: vi.fn(),
  getPastDuePatientsMock: vi.fn(),
}));

vi.mock('../services/PatientsHttpClient', () => ({
  PatientsHttpClient: vi.fn().mockImplementation(() => ({
    createPatient: createPatientMock,
    updatePatient: updatePatientMock,
    getPatients: getPatientsMock,
    getPastDuePatients: getPastDuePatientsMock,
  })),
}));

// PatientsView uses useRoute (?tab= deep link) + useRouter (Plans navigation).
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: vi.fn() }),
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

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    patientId: 1, userId: 10, patientName: 'Doe, John', medicalRecordNumber: 'L26-0001',
    cedula: null, dateOfBirth: '2015-01-15T00:00:00', email: 'john@example.com',
    phoneNumber: '555-0100', gender: 'Male', isActive: true, requiresDiscovery: true,
    hasCompletedDiscovery: true, createdTimestamp: '2025-01-01T00:00:00',
    caretakers: [], ...overrides,
  };
}

function paged<T>(items: T[]): PagedResult<T> {
  return { items, page: 1, pageSize: 30, totalCount: items.length };
}

async function openModal(p: Patient | null) {
  const pinia = authAs('MGR');
  const wrapper = mount(PatientFormModal, {
    props: { visible: false, patient: p },
    global: { plugins: [pinia], stubs: { teleport: true } },
  });
  await wrapper.setProps({ visible: true });
  return wrapper;
}

async function fillCreateFields(wrapper: Awaited<ReturnType<typeof openModal>>) {
  await wrapper.find('input[type="email"]').setValue('new@example.com');
  await wrapper.find('input[type="tel"]').setValue('555-0101');
  await wrapper.find('input[type="date"]').setValue('2015-01-15');
  await wrapper.find('select').setValue('Female'); // first select = gender
  const textInputs = wrapper.findAll('input[type="text"]');
  await textInputs[0].setValue('First'); // firstName
  await textInputs[2].setValue('Last');  // lastName
  await textInputs[3].setValue('8-999-1234'); // cedula — required at create (WP-25)
}

beforeEach(() => {
  vi.clearAllMocks();
  createPatientMock.mockResolvedValue(
    patient({ patientId: 99, patientName: 'Last, First', medicalRecordNumber: 'NC26-0001' })
  );
  updatePatientMock.mockResolvedValue(undefined);
  getPatientsMock.mockResolvedValue(paged([patient()]));
  getPastDuePatientsMock.mockResolvedValue([]);
});

describe('PatientFormModal — create mode has no MRN input (WP-36)', () => {
  it('renders the auto-assign note instead of an MRN input', async () => {
    const wrapper = await openModal(null);

    const note = wrapper.find('[data-testid="mrn-auto-note"]');
    expect(note.exists()).toBe(true);
    expect(note.text()).toContain('MRN assigned automatically on save');

    // No MRN input in create mode: text inputs are exactly first/middle/last/cedula.
    expect(wrapper.find('input[placeholder="Enter MRN"]').exists()).toBe(false);
    expect(wrapper.findAll('input[type="text"]')).toHaveLength(4);
    expect(wrapper.text()).not.toContain('temporary MRN');
  });

  it('submits a create payload with NO medicalRecordNumber key at all', async () => {
    const wrapper = await openModal(null);
    await fillCreateFields(wrapper);

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(createPatientMock).toHaveBeenCalled());

    const payload = createPatientMock.mock.calls[0][0] as Record<string, unknown>;
    // Not even `medicalRecordNumber: undefined` — the key must simply not exist.
    expect(Object.prototype.hasOwnProperty.call(payload, 'medicalRecordNumber')).toBe(false);
    expect(payload).toMatchObject({ firstName: 'First', lastName: 'Last', cedula: '8-999-1234' });
  });

  it('hands the create response (with the minted MRN) to the parent via `created`', async () => {
    const wrapper = await openModal(null);
    await fillCreateFields(wrapper);

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(createPatientMock).toHaveBeenCalled());

    const created = wrapper.emitted('created');
    expect(created).toHaveLength(1);
    expect(created![0][0]).toMatchObject({
      record: { patientId: 99, medicalRecordNumber: 'NC26-0001' },
    });
  });
});

describe('PatientsView — minted MRN surfaced after create (WP-36)', () => {
  function mountView() {
    return mount(PatientsView, {
      global: {
        plugins: [authAs('FD')],
        stubs: {
          O2MobileNav: true, O2Sidebar: true, O2Header: true, O2Footer: true,
          PatientFormModal: true, PaymentFormModal: true, CrossAddChainModal: true,
          PatientCaretakerPanel: true, teleport: true,
        },
      },
    });
  }

  it('shows the success banner with the minted NC{yy}-#### from the create response', async () => {
    const w = mountView();
    await flushPromises();

    const modal = w.findComponent({ name: 'PatientFormModal' });
    modal.vm.$emit('created', {
      record: patient({ patientId: 99, patientName: 'Last, First', medicalRecordNumber: 'NC26-0001' }),
      link: null,
    });
    await flushPromises();

    const banner = w.find('[data-testid="minted-mrn-banner"]');
    expect(banner.exists()).toBe(true);
    expect(w.find('[data-testid="minted-mrn-value"]').text()).toBe('NC26-0001');
  });
});

describe('PatientFormModal — edit mode unchanged (B2 + 409, WP-36 G4)', () => {
  it('still renders an editable MRN input hydrated with the current value', async () => {
    const wrapper = await openModal(patient({ medicalRecordNumber: 'L24-0123' }));
    const input = wrapper.find('input[placeholder="Enter MRN"]');
    expect(input.exists()).toBe(true);
    expect((input.element as HTMLInputElement).value).toBe('L24-0123');
  });

  it('surfaces the duplicate-MRN 409 message in the error banner', async () => {
    // HttpClientBase surfaces ProblemDetails detail as Error.message — the 409 arrives as this.
    updatePatientMock.mockRejectedValueOnce(
      new Error('A patient with this Medical Record Number already exists.')
    );
    const wrapper = await openModal(patient({ medicalRecordNumber: 'L24-0123' }));
    await wrapper.find('input[placeholder="Enter MRN"]').setValue('NC26-0001');

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(updatePatientMock).toHaveBeenCalled());
    await flushPromises();

    expect(updatePatientMock).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ medicalRecordNumber: 'NC26-0001' })
    );
    expect(wrapper.text()).toContain('A patient with this Medical Record Number already exists.');
  });
});
