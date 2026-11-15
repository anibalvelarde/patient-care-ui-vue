// WP-62 (E2E F-5, F-6 + ruling Q-4, owner correction after WP-50):
//   - email on EDIT: the form always sends the trimmed value, so clearing the field sends '' (the
//     API clears it to NULL) — before, a blank was left out and the old address silently stayed;
//     create still omits a blank;
//   - a patient keeps AT LEAST ONE primary caretaker (several are fine): "Make primary" /
//     "Remove primary" per row, the last primary can't be un-flagged or removed, an amber banner
//     when a (legacy) patient has none, and the link form's Primary box starts checked only when
//     the patient has no primary yet;
//   - "This patient is their own caretaker" for patients already on file (WP-50 API, new entry point).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia, type Pinia } from 'pinia';
import { mount, flushPromises } from '@vue/test-utils';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import type { Patient, PatientCaretakerSummary } from '../interfaces/Patient';
import type { Caretaker } from '../interfaces/Caretaker';
import { ApiError } from '../services/ApiError';
import PatientCaretakerPanel from '../components/patients/PatientCaretakerPanel.vue';
import PatientFormModal from '../components/patients/PatientFormModal.vue';
import CaretakerFormModal from '../components/caretakers/CaretakerFormModal.vue';
import CaretakerLinkForm from '../components/shared/CaretakerLinkForm.vue';

const m = vi.hoisted(() => ({
  getPatientCaretakers: vi.fn(),
  updatePatient: vi.fn().mockResolvedValue(undefined),
  createPatient: vi.fn().mockResolvedValue({ patientId: 99, medicalRecordNumber: 'NC26-0099' }),
  updateCaretaker: vi.fn().mockResolvedValue(undefined),
  createCaretaker: vi.fn().mockResolvedValue({ caretakerId: 77 }),
  setPrimary: vi.fn().mockResolvedValue(undefined),
  unlinkPatient: vi.fn().mockResolvedValue(undefined),
  linkPatient: vi.fn().mockResolvedValue(undefined),
  makeSelfCaretaker: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/PatientsHttpClient', () => ({
  PatientsHttpClient: vi.fn().mockImplementation(() => ({
    getPatientCaretakers: m.getPatientCaretakers,
    lookupPatients: vi.fn().mockResolvedValue([]),
    updatePatient: m.updatePatient,
    createPatient: m.createPatient,
  })),
}));
vi.mock('../services/CaretakersHttpClient', () => ({
  CaretakersHttpClient: vi.fn().mockImplementation(() => ({
    lookupCaretakers: vi.fn().mockResolvedValue([]),
    updateCaretaker: m.updateCaretaker,
    createCaretaker: m.createCaretaker,
    setPrimary: m.setPrimary,
    unlinkPatient: m.unlinkPatient,
    linkPatient: m.linkPatient,
    makeSelfCaretaker: m.makeSelfCaretaker,
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

const fullPatient: Patient = {
  patientId: 42, userId: 1, patientName: 'Vega, Lucía',
  medicalRecordNumber: 'NC26-0042', cedula: '8-000-0042', dateOfBirth: '1985-03-01T00:00:00',
  email: 'lucia.vega@example.test', phoneNumber: '555-0142', gender: 'Female', isActive: true,
  hasCompletedDiscovery: false, createdTimestamp: '2026-11-01T00:00:00', caretakers: [],
};
const fullCaretaker: Caretaker = {
  caretakerId: 10, userId: 2, caretakerName: 'Ríos, Marta',
  email: 'marta.rios@example.test', phoneNumber: '555-0110', notes: '', createdTimestamp: '2026-11-01T00:00:00',
  lastUpdated: '2026-11-01T00:00:00', isActive: true, patients: [],
};

const link = (caretakerId: number, isPrimaryCaretaker: boolean, relationshipToPatient = 'Mother'): PatientCaretakerSummary =>
  ({ caretakerId, caretakerName: `Caretaker ${caretakerId}`, isPrimaryCaretaker, relationshipToPatient }) as PatientCaretakerSummary;

async function openPanel(links: PatientCaretakerSummary[], role = 'FD') {
  m.getPatientCaretakers.mockResolvedValue(links);
  const wrapper = mount(PatientCaretakerPanel, {
    props: { patient: fullPatient },
    global: { plugins: [authAs(role)], stubs: { teleport: true } },
  });
  await flushPromises();
  return wrapper;
}

const row = (wrapper: ReturnType<typeof mount>, caretakerId: number) =>
  wrapper.findAll('.divide-y > div').find((r) => r.text().includes(`Caretaker ${caretakerId}`))!;

beforeEach(() => vi.clearAllMocks());

describe('WP-62 — email on edit (F-5)', () => {
  async function openPatientEdit() {
    const wrapper = mount(PatientFormModal, {
      props: { visible: false, patient: fullPatient },
      global: { plugins: [authAs('MGR')], stubs: { teleport: true } },
    });
    await wrapper.setProps({ visible: true });
    return wrapper;
  }

  it('patient edit: clearing the email sends "" (= clear), not an omitted field', async () => {
    const wrapper = await openPatientEdit();
    await wrapper.find('input[type="email"]').setValue('');
    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(m.updatePatient).toHaveBeenCalled());
    expect(m.updatePatient.mock.calls[0][1].email).toBe('');
  });

  it('patient edit: the email is trimmed', async () => {
    const wrapper = await openPatientEdit();
    await wrapper.find('input[type="email"]').setValue('  Lucia.New@Example.test  ');
    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(m.updatePatient).toHaveBeenCalled());
    expect(m.updatePatient.mock.calls[0][1].email).toBe('Lucia.New@Example.test');
  });

  it('caretaker edit: clearing the email sends ""; caretaker create still omits a blank', async () => {
    const edit = mount(CaretakerFormModal, {
      props: { visible: false, caretaker: fullCaretaker },
      global: { plugins: [authAs('MGR')], stubs: { teleport: true } },
    });
    await edit.setProps({ visible: true });
    await edit.find('input[type="email"]').setValue('   ');
    await edit.find('form').trigger('submit');
    await vi.waitFor(() => expect(m.updateCaretaker).toHaveBeenCalled());
    expect(m.updateCaretaker.mock.calls[0][1].email).toBe('');

    const create = mount(CaretakerFormModal, {
      props: { visible: false, caretaker: null },
      global: { plugins: [authAs('MGR')], stubs: { teleport: true } },
    });
    await create.setProps({ visible: true });
    const inputs = create.findAll('input'); // first, middle, last, email, phone
    await inputs[0].setValue('Ana');
    await inputs[2].setValue('Soto');
    await create.find('input[type="tel"]').setValue('555-0199');
    await create.find('input[type="email"]').setValue('   ');
    await create.find('form').trigger('submit');
    await vi.waitFor(() => expect(m.createCaretaker).toHaveBeenCalled());
    expect(m.createCaretaker.mock.calls[0][0].email).toBeUndefined();
  });
});

describe('WP-62 — at least one primary caretaker (F-6, ruling Q-4)', () => {
  it('the only primary can be neither un-flagged nor removed; the others can', async () => {
    const wrapper = await openPanel([link(1, true), link(2, false)]);

    const primaryRow = row(wrapper, 1);
    expect(primaryRow.find('[data-testid="remove-primary"]').attributes('disabled')).toBeDefined();
    expect(primaryRow.find('[data-testid="remove-caretaker"]').attributes('disabled')).toBeDefined();
    expect(wrapper.find('[data-testid="last-primary-hint"]').exists()).toBe(true);

    const otherRow = row(wrapper, 2);
    expect(otherRow.find('[data-testid="remove-caretaker"]').attributes('disabled')).toBeUndefined();
    expect(otherRow.find('[data-testid="make-primary"]').exists()).toBe(true);
  });

  it('with two primaries either one can be un-flagged', async () => {
    const wrapper = await openPanel([link(1, true), link(2, true)]);
    await row(wrapper, 1).find('[data-testid="remove-primary"]').trigger('click');
    await flushPromises();
    expect(m.setPrimary).toHaveBeenCalledWith(1, 42, false);
    expect(wrapper.find('[data-testid="last-primary-hint"]').exists()).toBe(false);
  });

  it('Make primary calls the API and reloads the list', async () => {
    const wrapper = await openPanel([link(1, true), link(2, false)]);
    await row(wrapper, 2).find('[data-testid="make-primary"]').trigger('click');
    await flushPromises();
    expect(m.setPrimary).toHaveBeenCalledWith(2, 42, true);
    expect(m.getPatientCaretakers).toHaveBeenCalledTimes(2);
  });

  it('the API 409 (e.g. someone else changed it meanwhile) is shown, not swallowed', async () => {
    m.setPrimary.mockRejectedValueOnce(new ApiError('Make another caretaker primary first.', 409));
    const wrapper = await openPanel([link(1, true), link(2, true)]);
    await row(wrapper, 1).find('[data-testid="remove-primary"]').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Make another caretaker primary first.');
  });

  it('a linked patient with NO primary shows the banner; none when one exists or when unlinked', async () => {
    expect((await openPanel([link(1, false), link(2, false)])).find('[data-testid="no-primary-banner"]').exists()).toBe(true);
    expect((await openPanel([link(1, true)])).find('[data-testid="no-primary-banner"]').exists()).toBe(false);
    expect((await openPanel([])).find('[data-testid="no-primary-banner"]').exists()).toBe(false);
  });

  it('the Add form starts with Primary checked only when the patient has no primary', async () => {
    const none = await openPanel([link(1, false)]);
    await none.findAll('button').find((b) => b.text().includes('Add Caretaker'))!.trigger('click');
    expect((none.find('[data-testid="link-primary-checkbox"]').element as HTMLInputElement).checked).toBe(true);

    const has = await openPanel([link(1, true)]);
    await has.findAll('button').find((b) => b.text().includes('Add Caretaker'))!.trigger('click');
    expect((has.find('[data-testid="link-primary-checkbox"]').element as HTMLInputElement).checked).toBe(false);
  });

  it('the shared link form defaults to unchecked and explains the first-caretaker rule', () => {
    const form = mount(CaretakerLinkForm, { props: { entityLabel: 'Patient', fetchOptions: async () => [] } });
    expect((form.find('[data-testid="link-primary-checkbox"]').element as HTMLInputElement).checked).toBe(false);
    expect(form.find('[data-testid="link-primary-hint"]').text()).toContain('The first caretaker is always primary');
  });

  it('without the link claim (ACCT) there are no primary or remove actions', async () => {
    const wrapper = await openPanel([link(1, true), link(2, false)], 'ACCT');
    expect(wrapper.find('[data-testid="make-primary"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="remove-primary"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="make-self-caretaker"]').exists()).toBe(false);
  });
});

describe('WP-62 — "their own caretaker" for a patient already on file', () => {
  it('confirm → calls the WP-50 endpoint, primary pre-checked when the patient has no primary', async () => {
    const wrapper = await openPanel([link(1, false, 'Relative')]);
    await wrapper.find('[data-testid="make-self-caretaker"]').trigger('click');
    expect((wrapper.find('[data-testid="self-primary-checkbox"]').element as HTMLInputElement).checked).toBe(true);
    await wrapper.find('[data-testid="self-confirm-yes"]').trigger('click');
    await flushPromises();
    expect(m.makeSelfCaretaker).toHaveBeenCalledWith(42, true);
  });

  it('primary starts unchecked when the patient already has a primary', async () => {
    const wrapper = await openPanel([link(1, true)]);
    await wrapper.find('[data-testid="make-self-caretaker"]').trigger('click');
    expect((wrapper.find('[data-testid="self-primary-checkbox"]').element as HTMLInputElement).checked).toBe(false);
    await wrapper.find('[data-testid="self-confirm-yes"]').trigger('click');
    await flushPromises();
    expect(m.makeSelfCaretaker).toHaveBeenCalledWith(42, false);
  });

  it('is hidden once the patient has a Self link', async () => {
    const wrapper = await openPanel([link(10, true, 'Self')]);
    expect(wrapper.find('[data-testid="make-self-caretaker"]').exists()).toBe(false);
  });

  it('a 409 says they are already their own caretaker', async () => {
    m.makeSelfCaretaker.mockRejectedValueOnce(new ApiError('Patient 42 is already their own caretaker.', 409));
    const wrapper = await openPanel([link(1, true)]);
    await wrapper.find('[data-testid="make-self-caretaker"]').trigger('click');
    await wrapper.find('[data-testid="self-confirm-yes"]').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('This patient is already their own caretaker.');
  });
});
