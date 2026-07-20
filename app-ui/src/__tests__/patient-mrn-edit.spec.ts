// B2 (meeting punch list 2026-07-07): correcting a patient's MRN from the edit modal.
//   The modal used to render the MRN read-only unless it was TEMP-prefixed, so imported
//   L24-/L25-/L26-#### MRNs could never be corrected — and even an editable value was
//   dropped from the PUT payload unless the "assign permanent MRN" path was taken.
//   Fix: MRN is generally editable on edit; a changed, non-blank value is always sent
//   (the API enforces uniqueness → 409).
// WP-36 (NP-1): the TEMP- flow is retired (system mints NC{yy}-#### at create) — the
//   temp-MRN hint + two-step assign-then-activate specs were removed with the dead code.

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

  it('keeps the input mounted while typing a new value char-by-char (repro: patient 917)', async () => {
    // Pre-B2, the input sat behind a v-if that reacted to the value being typed — clearing the
    // field and typing the first character of a new MRN flipped the v-if and unmounted the
    // input mid-keystroke ("textbox locks after one character"). The v-if is long gone (and
    // WP-36 removed the TEMP- styling branch entirely) — this guards against its return.
    const wrapper = await openEditModal(patient({ medicalRecordNumber: 'L24-0917', isActive: false }));

    for (const partial of ['', 'N', 'NC', 'NC-', 'NC-9', 'NC-91', 'NC-917']) {
      const input = wrapper.find(mrnInput);
      expect(input.exists()).toBe(true);
      await input.setValue(partial);
    }

    const survivor = wrapper.find(mrnInput);
    expect(survivor.exists()).toBe(true);
    expect((survivor.element as HTMLInputElement).value).toBe('NC-917');
  });
});
