// B2 (meeting punch list 2026-07-07): correcting a patient's MRN from the edit modal.
//   The modal used to render the MRN read-only unless it was TEMP-prefixed, so imported
//   L24-/L25-/L26-#### MRNs could never be corrected — and even an editable value was
//   dropped from the PUT payload unless the "assign permanent MRN" path was taken.
//   Fix: MRN is generally editable on edit; a changed, non-blank value is always sent
//   (the API enforces uniqueness → 409). TEMP- activation semantics are unchanged.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia, type Pinia } from 'pinia';
import { mount } from '@vue/test-utils';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import type { Patient } from '../interfaces/Patient';
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
    gender: 'Male',
    isActive: true,
    hasCompletedDiscovery: true,
    createdTimestamp: '2025-01-01T00:00:00',
    caretakers: [],
    ...overrides,
  };
}

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

const mrnInput = 'input[placeholder="Enter MRN"]';

beforeEach(() => {
  updatePatientMock.mockClear();
  createPatientMock.mockClear();
});

describe('PatientFormModal — MRN is editable on edit (B2)', () => {
  it('renders an editable MRN input for an imported L24-#### MRN (was read-only)', async () => {
    const wrapper = await openEditModal(patient({ medicalRecordNumber: 'L24-0123', isActive: false }));
    const input = wrapper.find(mrnInput);
    expect(input.exists()).toBe(true);
    expect((input.element as HTMLInputElement).value).toBe('L24-0123');
  });

  it('sends the corrected MRN on PUT when changed', async () => {
    const wrapper = await openEditModal(patient({ medicalRecordNumber: 'L24-0123', isActive: false }));
    await wrapper.find(mrnInput).setValue('  NC-2024-0123  ');

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(updatePatientMock).toHaveBeenCalled());

    expect(updatePatientMock).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ medicalRecordNumber: 'NC-2024-0123' })
    );
  });

  it('omits medicalRecordNumber from the payload when unchanged', async () => {
    const wrapper = await openEditModal(patient({ medicalRecordNumber: 'L24-0123', isActive: false }));

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(updatePatientMock).toHaveBeenCalled());

    expect(updatePatientMock).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ medicalRecordNumber: undefined })
    );
  });

  it('omits medicalRecordNumber when the field is blanked (blank never clears an MRN)', async () => {
    const wrapper = await openEditModal(patient({ medicalRecordNumber: 'L24-0123', isActive: false }));
    await wrapper.find(mrnInput).setValue('');

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(updatePatientMock).toHaveBeenCalled());

    expect(updatePatientMock).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ medicalRecordNumber: undefined })
    );
  });

  it('still shows the temporary-MRN hint and two-step activate flow for TEMP- patients', async () => {
    const wrapper = await openEditModal(patient({ medicalRecordNumber: 'TEMP-5', isActive: false }));
    expect(wrapper.text()).toContain('temporary MRN');

    await wrapper.find(mrnInput).setValue('NC-2026-0005');
    // Toggle Active Status on (enabled once the pending MRN is permanent).
    await wrapper.find('button.w-11').trigger('click');

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(updatePatientMock).toHaveBeenCalledTimes(2));

    // Step 1: assign the permanent MRN while still inactive; step 2: activate.
    expect(updatePatientMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({ medicalRecordNumber: 'NC-2026-0005', activeStatus: false })
    );
    expect(updatePatientMock.mock.calls[1][1]).toEqual(
      expect.objectContaining({ activeStatus: true })
    );
  });
});
