// WP-27 (F8/F9) — cross-add chained flows, Option A sequential hand-off (owner ruling 2026-07-13):
//   F8 — creating a patient offers "link/create a caretaker now" (bookings are F10-blocked
//        until a caretaker is linked).
//   F9 — creating a caretaker offers the mirror ("link/create a patient").
// Both directions link through the caretaker-side endpoint (POST /api/caretakers/{id}/patients)
// and gate on the claims the API enforces: Caretakers.LinkPatient (+ Caretakers.Edit /
// Patients.Edit for create-new). Create-then-link is two calls — a failed link keeps the chain
// open with a retry.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia, type Pinia } from 'pinia';
import { mount, flushPromises } from '@vue/test-utils';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import type { Patient } from '../interfaces/Patient';
import type { Caretaker } from '../interfaces/Caretaker';
import PatientFormModal from '../components/patients/PatientFormModal.vue';
import CaretakerFormModal from '../components/caretakers/CaretakerFormModal.vue';
import CrossAddChainModal from '../components/shared/CrossAddChainModal.vue';

// ── shared mocks (wp23/wp24 spec pattern) ────────────────────────────────────

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    patientId: 42,
    userId: 10,
    patientName: 'Gómez, Valentina',
    medicalRecordNumber: 'L26-0921',
    cedula: '8-999-1234',
    dateOfBirth: '2019-03-14T00:00:00',
    email: 'vgomez@example.com',
    phoneNumber: '555-0101',
    gender: 'Female',
    isActive: true,
    hasSenadisDiscount: false,
    requiresDiscovery: true,
    hasCompletedDiscovery: false,
    createdTimestamp: '2026-07-13T00:00:00',
    caretakers: [],
    ...overrides,
  };
}

function caretaker(overrides: Partial<Caretaker> = {}): Caretaker {
  return {
    caretakerId: 7,
    caretakerName: 'Delgado, María',
    email: 'mdelgado@example.com',
    phoneNumber: '555-0202',
    notes: '',
    isActive: true,
    ...overrides,
  } as Caretaker;
}

const {
  getCaretakersMock,
  createCaretakerMock,
  linkPatientMock,
  getPatientsMock,
  createPatientMock,
  updatePatientMock,
} = vi.hoisted(() => ({
  getCaretakersMock: vi.fn(),
  createCaretakerMock: vi.fn(),
  linkPatientMock: vi.fn(),
  getPatientsMock: vi.fn(),
  createPatientMock: vi.fn(),
  updatePatientMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/CaretakersHttpClient', () => ({
  CaretakersHttpClient: vi.fn().mockImplementation(() => ({
    getCaretakers: getCaretakersMock,
    createCaretaker: createCaretakerMock,
    linkPatient: linkPatientMock,
  })),
}));

vi.mock('../services/PatientsHttpClient', () => ({
  PatientsHttpClient: vi.fn().mockImplementation(() => ({
    getPatients: getPatientsMock,
    createPatient: createPatientMock,
    updatePatient: updatePatientMock,
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
  getCaretakersMock.mockResolvedValue([caretaker()]);
  getPatientsMock.mockResolvedValue([patient({ patientId: 55, patientName: 'Herrera, Lucas' })]);
  createCaretakerMock.mockResolvedValue(caretaker({ caretakerId: 77 }));
  createPatientMock.mockResolvedValue(patient({ patientId: 99, patientName: 'Martínez, Diego', medicalRecordNumber: 'MRN-099' }));
  linkPatientMock.mockResolvedValue(undefined);
});

// ── form modals: `created` emit (the chain trigger) ──────────────────────────

async function openModal(component: typeof PatientFormModal | typeof CaretakerFormModal, pinia: Pinia, props: Record<string, unknown>) {
  const wrapper = mount(component, {
    props: { visible: false, ...props },
    global: { plugins: [pinia], stubs: { teleport: true } },
  });
  await wrapper.setProps({ visible: true });
  return wrapper;
}

async function fillPatientCreateFields(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('input[type="email"]').setValue('new@example.com');
  await wrapper.find('input[type="tel"]').setValue('555-0101');
  await wrapper.find('input[type="date"]').setValue('2019-03-14');
  await wrapper.find('select').setValue('Female'); // first select = gender
  const textInputs = wrapper.findAll('input[type="text"]');
  await textInputs[0].setValue('Valentina');
  await textInputs[2].setValue('Gómez');
  await textInputs[3].setValue('8-999-1234'); // cedula — required at create (WP-25)
}

describe('PatientFormModal — chain trigger `created` emit (F8)', () => {
  it('CREATE emits `created` with the record and a null link (no chain context)', async () => {
    const wrapper = await openModal(PatientFormModal, authAs('FD'), { patient: null });
    await fillPatientCreateFields(wrapper);
    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(createPatientMock).toHaveBeenCalled());

    const created = wrapper.emitted('created');
    expect(created).toHaveLength(1);
    expect(created![0][0]).toMatchObject({
      record: { patientId: 99, patientName: 'Martínez, Diego' },
      link: null,
    });
  });

  it('EDIT does not emit `created`', async () => {
    const wrapper = await openModal(PatientFormModal, authAs('MGR'), { patient: patient() });
    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(updatePatientMock).toHaveBeenCalled());
    expect(wrapper.emitted('created')).toBeUndefined();
  });

  it('as a chain create-step (linkTo set): banner shown, link fields ride the `created` emit', async () => {
    const wrapper = await openModal(PatientFormModal, authAs('MGR'), {
      patient: null,
      linkTo: { name: 'Martínez, Rosa' },
    });

    expect(wrapper.find('[data-testid="chain-context-banner"]').text()).toContain('Martínez, Rosa');

    await fillPatientCreateFields(wrapper);
    await wrapper.find('[data-testid="chain-relationship-select"]').setValue('Mother');
    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(createPatientMock).toHaveBeenCalled());

    expect(wrapper.emitted('created')![0][0]).toMatchObject({
      record: { patientId: 99 },
      link: { relationship: 'Mother', isPrimary: true },
    });
  });
});

describe('CaretakerFormModal — chain trigger `created` emit (F9) + create-step fields (F8)', () => {
  async function fillCaretakerCreateFields(wrapper: ReturnType<typeof mount>) {
    const textInputs = wrapper.findAll('input[type="text"]');
    await textInputs[0].setValue('María');
    await textInputs[2].setValue('Delgado');
    await wrapper.find('input[type="email"]').setValue('mdelgado@example.com');
    await wrapper.find('input[type="tel"]').setValue('555-0202');
  }

  it('CREATE emits `created` with the record and a null link', async () => {
    const wrapper = await openModal(CaretakerFormModal, authAs('FD'), { caretaker: null });
    await fillCaretakerCreateFields(wrapper);
    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(createCaretakerMock).toHaveBeenCalled());

    expect(wrapper.emitted('created')![0][0]).toMatchObject({
      record: { caretakerId: 77 },
      link: null,
    });
  });

  it('as a chain create-step (linkTo set): banner + relationship/primary in the payload', async () => {
    const wrapper = await openModal(CaretakerFormModal, authAs('FD'), {
      caretaker: null,
      linkTo: { name: 'Gómez, Valentina' },
    });

    expect(wrapper.find('[data-testid="chain-context-banner"]').text()).toContain('Gómez, Valentina');

    await fillCaretakerCreateFields(wrapper);
    await wrapper.find('[data-testid="chain-relationship-select"]').setValue('Mother');
    await wrapper.find('[data-testid="chain-primary-checkbox"]').setValue(false);
    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(createCaretakerMock).toHaveBeenCalled());

    expect(wrapper.emitted('created')![0][0]).toMatchObject({
      record: { caretakerId: 77 },
      link: { relationship: 'Mother', isPrimary: false },
    });
  });
});

// ── CrossAddChainModal ───────────────────────────────────────────────────────

const F8_TARGET = { id: 42, name: 'Gómez, Valentina' };
const F9_TARGET = { id: 9, name: 'Martínez, Rosa' };

async function openChain(pinia: Pinia, mode: 'add-caretaker' | 'add-patient', target = mode === 'add-caretaker' ? F8_TARGET : F9_TARGET) {
  const wrapper = mount(CrossAddChainModal, {
    props: { visible: false, mode, target },
    global: { plugins: [pinia], stubs: { teleport: true } },
  });
  await wrapper.setProps({ visible: true });
  await flushPromises();
  return wrapper;
}

describe('CrossAddChainModal — chooser', () => {
  it('MGR sees link-existing, create-new, and Later; "Later" closes clean with no API calls', async () => {
    const wrapper = await openChain(authAs('MGR'), 'add-caretaker');

    expect(wrapper.find('[data-testid="chain-chooser"]').text()).toContain('bookings are blocked');
    expect(wrapper.find('[data-testid="chain-link-existing"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="chain-create-new"]').exists()).toBe(true);

    await wrapper.find('[data-testid="chain-later"]').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(linkPatientMock).not.toHaveBeenCalled();
    expect(createCaretakerMock).not.toHaveBeenCalled();
  });

  it('OWN (read-only oversight) sees no link/create affordances, only Later', async () => {
    const wrapper = await openChain(authAs('OWN'), 'add-caretaker');

    expect(wrapper.find('[data-testid="chain-link-existing"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="chain-create-new"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="chain-later"]').exists()).toBe(true);
  });
});

describe('CrossAddChainModal — link existing', () => {
  it('F8: links the selected caretaker TO the new patient — linkPatient(caretakerId, patientId, isPrimary, relationship)', async () => {
    const wrapper = await openChain(authAs('MGR'), 'add-caretaker');
    await wrapper.find('[data-testid="chain-link-existing"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="chain-link-banner"]').text()).toContain('Gómez, Valentina');

    await wrapper.find('[data-testid="link-entity-select"]').setValue(7);
    await wrapper.find('[data-testid="link-relationship-select"]').setValue('Mother');
    await wrapper.find('[data-testid="link-submit"]').trigger('click');
    await flushPromises();

    expect(linkPatientMock).toHaveBeenCalledWith(7, 42, true, 'Mother');
    expect(wrapper.find('[data-testid="chain-success"]').text()).toContain('is now bookable');
    expect(wrapper.emitted('linked')).toHaveLength(1);
  });

  it('F9: mirrored orientation — the new caretaker is the link owner', async () => {
    const wrapper = await openChain(authAs('MGR'), 'add-patient');
    await wrapper.find('[data-testid="chain-link-existing"]').trigger('click');
    await flushPromises();

    await wrapper.find('[data-testid="link-entity-select"]').setValue(55);
    await wrapper.find('[data-testid="link-relationship-select"]').setValue('Relative');
    await wrapper.find('[data-testid="link-submit"]').trigger('click');
    await flushPromises();

    expect(linkPatientMock).toHaveBeenCalledWith(9, 55, true, 'Relative');
  });

  it('link failure keeps the form open with the error (retry affordance)', async () => {
    linkPatientMock.mockRejectedValueOnce(new Error('Network error'));
    const wrapper = await openChain(authAs('MGR'), 'add-caretaker');
    await wrapper.find('[data-testid="chain-link-existing"]').trigger('click');
    await flushPromises();

    await wrapper.find('[data-testid="link-entity-select"]').setValue(7);
    await wrapper.find('[data-testid="link-submit"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="chain-error"]').text()).toContain('Network error');
    expect(wrapper.find('[data-testid="link-submit"]').exists()).toBe(true); // still on the link step

    // Note: the teleport STUB recreates the link form on re-render, dropping the selection —
    // verified against a real (unstubbed) teleport that the selection survives a failed link and
    // a plain second click retries. Re-select here to keep the stub-based test honest.
    await wrapper.find('[data-testid="link-entity-select"]').setValue(7);
    await wrapper.find('[data-testid="link-submit"]').trigger('click');
    await flushPromises();
    expect(linkPatientMock).toHaveBeenCalledTimes(2);
    expect(wrapper.find('[data-testid="chain-success"]').exists()).toBe(true);
  });
});

describe('CrossAddChainModal — create new', () => {
  async function runF8CreateNew(wrapper: Awaited<ReturnType<typeof openChain>>) {
    await wrapper.find('[data-testid="chain-create-new"]').trigger('click');
    await flushPromises();

    // The real CaretakerFormModal renders as the create step, with the chain context banner
    expect(wrapper.find('[data-testid="chain-context-banner"]').text()).toContain('Gómez, Valentina');

    const textInputs = wrapper.findAll('input[type="text"]');
    await textInputs[0].setValue('María');
    await textInputs[2].setValue('Delgado');
    await wrapper.find('input[type="email"]').setValue('mdelgado@example.com');
    await wrapper.find('input[type="tel"]').setValue('555-0202');
    await wrapper.find('[data-testid="chain-relationship-select"]').setValue('Mother');
    await wrapper.find('form').trigger('submit');
    await flushPromises();
  }

  it('F8: fires create then link with the new caretaker id and the captured link fields', async () => {
    const wrapper = await openChain(authAs('MGR'), 'add-caretaker');
    await runF8CreateNew(wrapper);

    expect(createCaretakerMock).toHaveBeenCalledTimes(1);
    expect(linkPatientMock).toHaveBeenCalledWith(77, 42, true, 'Mother');
    expect(wrapper.find('[data-testid="chain-success"]').text()).toContain('created and linked');
  });

  it('F8: created-but-link-failed shows the retry card; retry completes the link', async () => {
    linkPatientMock.mockRejectedValueOnce(new Error('409 already linked'));
    const wrapper = await openChain(authAs('MGR'), 'add-caretaker');
    await runF8CreateNew(wrapper);

    const failed = wrapper.find('[data-testid="chain-link-failed"]');
    expect(failed.exists()).toBe(true);
    expect(failed.text()).toContain('was created, but linking failed');

    await wrapper.find('[data-testid="chain-retry-link"]').trigger('click');
    await flushPromises();
    expect(linkPatientMock).toHaveBeenCalledTimes(2);
    expect(linkPatientMock).toHaveBeenLastCalledWith(77, 42, true, 'Mother');
    expect(wrapper.find('[data-testid="chain-success"]').exists()).toBe(true);
  });
});
