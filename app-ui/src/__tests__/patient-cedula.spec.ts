// Cedula follow-ups (intake 2026-06-29-001):
//   item 1 — Cedula is PII: the All-patients grid must only acknowledge a value is on file,
//            never render the raw government ID (it stays in the edit modal + search);
//   item 3 — SUPERSEDED by WP-25 (F5): "Cedula | Passport" is required at create and an
//            on-file value can never be cleared (blank is never sent — the API 400s it;
//            omitted = unchanged, which keeps legacy NULL-cedula patients editable).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia, type Pinia } from 'pinia';
import { mount } from '@vue/test-utils';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import type { Patient } from '../interfaces/Patient';
import PatientTable from '../components/patients/PatientTable.vue';
import PatientFormModal from '../components/patients/PatientFormModal.vue';

const { updatePatientMock, createPatientMock } = vi.hoisted(() => ({
  updatePatientMock: vi.fn().mockResolvedValue(undefined),
  createPatientMock: vi.fn().mockResolvedValue({ patientId: 99, medicalRecordNumber: 'MRN-099' }),
}));

vi.mock('../services/PatientsHttpClient', () => ({
  PatientsHttpClient: vi.fn().mockImplementation(() => ({
    updatePatient: updatePatientMock,
    createPatient: createPatientMock,
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

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    patientId: 1,
    userId: 10,
    patientName: 'Doe, John',
    medicalRecordNumber: 'MRN-001',
    cedula: null,
    dateOfBirth: '2000-01-15T00:00:00',
    email: 'john@example.com',
    phoneNumber: '555-0100',
    gender: 'M',
    isActive: true,
    hasCompletedDiscovery: true,
    createdTimestamp: '2025-01-01T00:00:00',
    caretakers: [],
    ...overrides,
  };
}

beforeEach(() => {
  updatePatientMock.mockClear();
  createPatientMock.mockClear();
});

describe('PatientTable — Cedula PII acknowledgement (item 1)', () => {
  it('never renders the raw cedula; shows an "On file" badge instead', () => {
    const pinia = authAs('MGR');
    const wrapper = mount(PatientTable, {
      props: { patients: [patient({ patientId: 1, cedula: '001-1234567-8' })] },
      global: { plugins: [pinia] },
    });

    expect(wrapper.text()).not.toContain('001-1234567-8');
    expect(wrapper.text()).toContain('On file');
  });

  it('shows a dash when no cedula is recorded', () => {
    const pinia = authAs('MGR');
    const wrapper = mount(PatientTable, {
      props: { patients: [patient({ patientId: 2, cedula: null })] },
      global: { plugins: [pinia] },
    });

    expect(wrapper.text()).not.toContain('On file');
    expect(wrapper.text()).toContain('—');
  });
});

const cedulaSelector = 'input[placeholder="Cedula or passport number"]';

async function openEditModal(p: Patient) {
  const pinia = authAs('MGR');
  const wrapper = mount(PatientFormModal, {
    props: { visible: false, patient: p },
    // Render the <teleport to="body"> content in place so find() can reach the form.
    global: { plugins: [pinia], stubs: { teleport: true } },
  });
  // The form hydrates on the visible=false→true transition.
  await wrapper.setProps({ visible: true });
  return wrapper;
}

describe('PatientFormModal — cedula clear is blocked (WP-25 supersedes item 3)', () => {
  it('blocks clearing an on-file value: error banner shown, no PUT', async () => {
    const wrapper = await openEditModal(patient({ cedula: '001-1234567-8' }));
    const cedulaInput = wrapper.find(cedulaSelector);
    await cedulaInput.setValue('');

    await wrapper.find('form').trigger('submit');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Cedula | Passport cannot be cleared.');
    expect(updatePatientMock).not.toHaveBeenCalled();
  });

  it('still sends the (trimmed) value when the field is filled', async () => {
    const wrapper = await openEditModal(patient({ cedula: null }));
    const cedulaInput = wrapper.find(cedulaSelector);
    await cedulaInput.setValue('  002-7654321-9  ');

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(updatePatientMock).toHaveBeenCalled());

    expect(updatePatientMock).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ cedula: '002-7654321-9' })
    );
  });
});

describe('PatientFormModal — WP-25 (F5) Cedula | Passport required', () => {
  async function openCreateModal() {
    const pinia = authAs('MGR');
    const wrapper = mount(PatientFormModal, {
      props: { visible: false, patient: null },
      global: { plugins: [pinia], stubs: { teleport: true } },
    });
    await wrapper.setProps({ visible: true });
    return wrapper;
  }

  async function fillRequiredCreateFieldsExceptCedula(wrapper: Awaited<ReturnType<typeof openCreateModal>>) {
    await wrapper.find('input[type="email"]').setValue('new@example.com');
    await wrapper.find('input[type="tel"]').setValue('555-0101');
    await wrapper.find('input[type="date"]').setValue('2015-01-15');
    await wrapper.find('select').setValue('Male');
    const textInputs = wrapper.findAll('input[type="text"]');
    await textInputs[0].setValue('First'); // firstName
    await textInputs[2].setValue('Last');  // lastName
  }

  it('CREATE: blocked when cedula is blank — error banner, no POST', async () => {
    const wrapper = await openCreateModal();
    await fillRequiredCreateFieldsExceptCedula(wrapper);

    await wrapper.find('form').trigger('submit');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Please fill in all required fields.');
    expect(createPatientMock).not.toHaveBeenCalled();
  });

  it('CREATE: sends the trimmed cedula when supplied', async () => {
    const wrapper = await openCreateModal();
    await fillRequiredCreateFieldsExceptCedula(wrapper);
    await wrapper.find(cedulaSelector).setValue('  001-1234567-8  ');

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(createPatientMock).toHaveBeenCalled());

    expect(createPatientMock).toHaveBeenCalledWith(
      expect.objectContaining({ cedula: '001-1234567-8' })
    );
  });

  it('EDIT (legacy, no stored cedula): unrelated edit allowed — PUT omits cedula, amber nag shown', async () => {
    const wrapper = await openEditModal(patient({ cedula: null }));

    expect(wrapper.text()).toContain('No Cedula | Passport on file — capture it when available.');

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(updatePatientMock).toHaveBeenCalled());

    // Omitted (undefined) = unchanged server-side; blank '' would 400.
    expect(updatePatientMock.mock.calls[0][1].cedula).toBeUndefined();
  });

  it('EDIT (stored cedula): value round-trips — hydrated into the input and sent trimmed', async () => {
    const wrapper = await openEditModal(patient({ cedula: '001-1234567-8' }));
    const cedulaInput = wrapper.find(cedulaSelector);
    expect((cedulaInput.element as HTMLInputElement).value).toBe('001-1234567-8');
    // No nag for a patient whose cedula is on file.
    expect(wrapper.text()).not.toContain('No Cedula | Passport on file');

    await cedulaInput.setValue('  001-1234567-8  '); // stray whitespace is trimmed off

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(updatePatientMock).toHaveBeenCalled());

    expect(updatePatientMock).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ cedula: '001-1234567-8' })
    );
  });
});
