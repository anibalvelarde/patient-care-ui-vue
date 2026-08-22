// WP-50 (owner ruling 2026-08-22): a "Self" caretaker link is permanent — the API 409s an unlink,
// and the UI must not offer a Remove/Unlink affordance for it (from either side). Removing it would
// strand the caretaker identity minted on the patient's own SystemUser and let a duplicate be minted.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia, type Pinia } from 'pinia';
import { shallowMount, flushPromises } from '@vue/test-utils';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import PatientCaretakerPanel from '../components/patients/PatientCaretakerPanel.vue';
import CaretakerPatientsList from '../components/caretakers/CaretakerPatientsList.vue';

const { getPatientCaretakersMock, getCaretakerPatientsMock } = vi.hoisted(() => ({
  getPatientCaretakersMock: vi.fn(),
  getCaretakerPatientsMock: vi.fn(),
}));

vi.mock('../services/PatientsHttpClient', () => ({
  PatientsHttpClient: vi.fn().mockImplementation(() => ({
    getPatientCaretakers: getPatientCaretakersMock,
    lookupPatients: vi.fn().mockResolvedValue([]),
  })),
}));
vi.mock('../services/CaretakersHttpClient', () => ({
  CaretakersHttpClient: vi.fn().mockImplementation(() => ({
    getCaretakerPatients: getCaretakerPatientsMock,
    lookupCaretakers: vi.fn().mockResolvedValue([]),
    unlinkPatient: vi.fn(),
    linkPatient: vi.fn(),
  })),
}));

function authAs(role: string): Pinia {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useAuthStore();
  const claims = (manifest.claims as Array<{ claim: string; grants: string[] }>)
    .filter((c) => c.grants.includes(role))
    .map((c) => ({ type: 'Permission', value: c.claim })) as ClaimDto[];
  store.user = {
    userId: 1, email: 't@e.com', fullName: 'T', mustChangePassword: false,
    roles: [role], claims, isSystemAdmin: false,
  };
  return pinia;
}

const removeButtons = (wrapper: { findAll: (s: string) => Array<{ text: () => string }> }, label: string) =>
  wrapper.findAll('button').filter((b) => b.text() === label);

beforeEach(() => vi.clearAllMocks());

describe('WP-50 — Self link has no Remove on the patient panel', () => {
  it('FD sees Remove for a normal caretaker but NOT for the Self one', async () => {
    getPatientCaretakersMock.mockResolvedValue([
      { caretakerId: 10, caretakerName: 'Self, Adult', relationshipToPatient: 'Self', isPrimaryCaretaker: true },
      { caretakerId: 11, caretakerName: 'Madre, Rosa', relationshipToPatient: 'Mother', isPrimaryCaretaker: false },
    ]);
    const wrapper = shallowMount(PatientCaretakerPanel, {
      props: { patient: { patientId: 42, patientName: 'Adult, Self' } },
      global: { plugins: [authAs('FD')], stubs: { teleport: true } },
    });
    await flushPromises();

    const removes = removeButtons(wrapper, 'Remove');
    expect(removes).toHaveLength(1); // only the Mother link is removable
  });
});

describe('WP-50 — Self link has no Unlink on the caretaker panel', () => {
  it('FD sees Unlink for a normal patient but NOT for the Self one', async () => {
    getCaretakerPatientsMock.mockResolvedValue([
      { patientId: 42, patientName: 'Adult, Self', relationshipToPatient: 'Self', isPrimaryCaretaker: true },
      { patientId: 43, patientName: 'Nino, Otro', relationshipToPatient: 'Relative', isPrimaryCaretaker: false },
    ]);
    const wrapper = shallowMount(CaretakerPatientsList, {
      props: { caretaker: { caretakerId: 10, caretakerName: 'Adult, Self' } },
      global: { plugins: [authAs('FD')], stubs: { teleport: true } },
    });
    await flushPromises();

    const unlinks = removeButtons(wrapper, 'Unlink');
    expect(unlinks).toHaveLength(1); // only the Relative link is unlinkable
  });
});
