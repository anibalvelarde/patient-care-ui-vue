// WP-30C (U2) — server paging for the patients/caretakers lists + shared lookup typeahead:
//   - GET /api/patients and /api/caretakers now return the WP-21 PagedResult envelope
//     (BREAKING pair of WP-30B): the list views page/search/tab-filter server-side.
//   - The Active/Inactive tabs are the server's isActive query param, not a client filter.
//   - Every dropdown/picker that used to load the full census goes through LookupSelect,
//     a debounced (300ms, min 1 char) typeahead over the new capped lookup endpoints.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia, type Pinia } from 'pinia';
import { mount, flushPromises } from '@vue/test-utils';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import type { Patient } from '../interfaces/Patient';
import type { Caretaker } from '../interfaces/Caretaker';
import type { PagedResult } from '../interfaces/SessionHistory';
import type { PaymentRecord } from '../interfaces/Payment';
import LookupSelect, { type LookupOption } from '../components/shared/LookupSelect.vue';
import PatientList from '../components/patients/PatientList.vue';
import CaretakerList from '../components/caretakers/CaretakerList.vue';
import PatientsView from '../views/PatientsView.vue';
import BookingFormModal from '../components/appointments/BookingFormModal.vue';
import PaymentFormModal from '../components/payments/PaymentFormModal.vue';
import CaretakerPatientsList from '../components/caretakers/CaretakerPatientsList.vue';
import PatientCaretakerPanel from '../components/patients/PatientCaretakerPanel.vue';
import CaretakerStatementControls from '../components/statements/CaretakerStatementControls.vue';

// ── shared mocks ─────────────────────────────────────────────────────────────

const {
  getPatientsMock, lookupPatientsMock, getPatientMock, getPatientCaretakersMock, getPastDuePatientsMock,
  getCaretakersMock, lookupCaretakersMock, getCaretakerMock, getCaretakerPatientsMock, linkPatientMock,
  getPaymentTypesMock, getUnpaidSessionsMock, lookupGetAllMock,
} = vi.hoisted(() => ({
  getPatientsMock: vi.fn(),
  lookupPatientsMock: vi.fn(),
  getPatientMock: vi.fn(),
  getPatientCaretakersMock: vi.fn(),
  getPastDuePatientsMock: vi.fn(),
  getCaretakersMock: vi.fn(),
  lookupCaretakersMock: vi.fn(),
  getCaretakerMock: vi.fn(),
  getCaretakerPatientsMock: vi.fn(),
  linkPatientMock: vi.fn(),
  getPaymentTypesMock: vi.fn(),
  getUnpaidSessionsMock: vi.fn(),
  lookupGetAllMock: vi.fn(),
}));

vi.mock('../services/PatientsHttpClient', () => ({
  PatientsHttpClient: vi.fn().mockImplementation(() => ({
    getPatients: getPatientsMock,
    lookupPatients: lookupPatientsMock,
    getPatient: getPatientMock,
    getPatientCaretakers: getPatientCaretakersMock,
    getPastDuePatients: getPastDuePatientsMock,
  })),
}));

vi.mock('../services/CaretakersHttpClient', () => ({
  CaretakersHttpClient: vi.fn().mockImplementation(() => ({
    getCaretakers: getCaretakersMock,
    lookupCaretakers: lookupCaretakersMock,
    getCaretaker: getCaretakerMock,
    getCaretakerPatients: getCaretakerPatientsMock,
    linkPatient: linkPatientMock,
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

vi.mock('../services/PaymentsHttpClient', () => ({
  PaymentsHttpClient: vi.fn().mockImplementation(() => ({
    getPaymentTypes: getPaymentTypesMock,
    getUnpaidSessions: getUnpaidSessionsMock,
  })),
}));

// PatientsView uses useRoute (?tab= deep link) + useRouter; CaretakerPatientsList uses useRouter.
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

// ── factories ────────────────────────────────────────────────────────────────

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    patientId: 1, userId: 10, patientName: 'Doe, John', medicalRecordNumber: 'MRN-001',
    cedula: null, dateOfBirth: '2015-01-15T00:00:00', email: 'john@example.com',
    phoneNumber: '555-0100', gender: 'Male', isActive: true, hasSenadisDiscount: false,
    requiresDiscovery: false, hasCompletedDiscovery: true, createdTimestamp: '2025-01-01T00:00:00',
    caretakers: [], ...overrides,
  };
}

function caretaker(overrides: Partial<Caretaker> = {}): Caretaker {
  return {
    caretakerId: 9, caretakerName: 'Delgado, María', email: 'mdelgado@example.com',
    phoneNumber: '555-0202', notes: '', isActive: true, patients: [],
    createdTimestamp: '', lastUpdated: '', ...overrides,
  } as Caretaker;
}

function paged<T>(items: T[], overrides: Partial<PagedResult<T>> = {}): PagedResult<T> {
  return { items, page: 1, pageSize: 30, totalCount: items.length, ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  getPatientsMock.mockResolvedValue(paged([patient()], { totalCount: 65 }));
  getCaretakersMock.mockResolvedValue(paged([caretaker()], { totalCount: 40 }));
  lookupPatientsMock.mockResolvedValue([
    { patientId: 1, patientName: 'Doe, John', medicalRecordNumber: 'MRN-001' },
    { patientId: 55, patientName: 'Herrera, Lucas', medicalRecordNumber: 'L26-0001' },
  ]);
  lookupCaretakersMock.mockResolvedValue([{ caretakerId: 9, caretakerName: 'Delgado, María' }]);
  getPatientMock.mockResolvedValue(patient());
  getCaretakerMock.mockResolvedValue(caretaker());
  getPatientCaretakersMock.mockResolvedValue([
    { caretakerId: 9, caretakerName: 'Delgado, María', isPrimaryCaretaker: true, relationshipToPatient: 'Mother' },
  ]);
  getCaretakerPatientsMock.mockResolvedValue([]);
  getPastDuePatientsMock.mockResolvedValue([]);
  linkPatientMock.mockResolvedValue(undefined);
  getPaymentTypesMock.mockResolvedValue([{ paymentTypeId: 1, abbreviation: 'EFT', name: 'Transfer' }]);
  getUnpaidSessionsMock.mockResolvedValue([]);
  lookupGetAllMock.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

// Type into a LookupSelect input, ride out the 300ms debounce, and pick the first result.
async function typeahead(wrapper: ReturnType<typeof mount>, testId: string, query: string) {
  const input = wrapper.find(`[data-testid="${testId}-input"]`);
  await input.trigger('focus'); // the dropdown only opens on focus
  await input.setValue(query);
  vi.advanceTimersByTime(300);
  await flushPromises();
}

// ── LookupSelect — the shared typeahead itself ───────────────────────────────

describe('LookupSelect — debounced server-backed typeahead', () => {
  function mountLookup(fetchOptions: (q: string) => Promise<LookupOption[]>, props: Record<string, unknown> = {}) {
    return mount(LookupSelect, { props: { fetchOptions, ...props } });
  }

  it('shows the type-to-search empty state until the user types', async () => {
    const fetchFn = vi.fn();
    const w = mountLookup(fetchFn);
    await w.find('[data-testid="lookup-input"]').trigger('focus');
    expect(w.find('[data-testid="lookup-empty"]').text()).toContain('Type to search');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('debounces the fetch (one call after 300ms) and renders name + detail rows', async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn().mockResolvedValue([
      { id: 1, name: 'Doe, John', detail: 'MRN MRN-001' },
      { id: 2, name: 'Doe, Jane', detail: null },
    ]);
    const w = mountLookup(fetchFn);
    const input = w.find('[data-testid="lookup-input"]');
    await input.trigger('focus');
    await input.setValue('do');
    await input.setValue('doe');
    expect(fetchFn).not.toHaveBeenCalled(); // still inside the debounce window

    vi.advanceTimersByTime(300);
    await flushPromises();
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledWith('doe');
    const options = w.findAll('[data-testid="lookup-option"]');
    expect(options).toHaveLength(2);
    expect(options[0].text()).toContain('MRN MRN-001');
  });

  it('picking emits update:modelValue; the selected card clears back to null', async () => {
    vi.useFakeTimers();
    const option = { id: 1, name: 'Doe, John', detail: 'MRN MRN-001' };
    const fetchFn = vi.fn().mockResolvedValue([option]);
    const w = mountLookup(fetchFn);
    await typeahead(w, 'lookup', 'doe');
    await w.find('[data-testid="lookup-option"]').trigger('mousedown');
    expect(w.emitted('update:modelValue')![0]).toEqual([option]);

    // Selected card renders when the parent binds the picked value back in.
    await w.setProps({ modelValue: option });
    expect(w.find('[data-testid="lookup-selected"]').text()).toContain('Doe, John');
    await w.find('[data-testid="lookup-clear"]').trigger('click');
    expect(w.emitted('update:modelValue')![1]).toEqual([null]);
  });

  it('excludeIds hides rows; an all-excluded result reads as no matches', async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn().mockResolvedValue([{ id: 1, name: 'Doe, John' }]);
    const w = mountLookup(fetchFn, { excludeIds: [1] });
    await typeahead(w, 'lookup', 'doe');
    expect(w.findAll('[data-testid="lookup-option"]')).toHaveLength(0);
    expect(w.find('[data-testid="lookup-empty"]').text()).toContain('No matches for "doe"');
  });
});

// ── PatientList / CaretakerList — server-paging contract ─────────────────────

describe('PatientList — pager math + query-change emits', () => {
  function mountList(props: Record<string, unknown> = {}) {
    return mount(PatientList, {
      props: { patients: [patient()], totalCount: 65, page: 1, pageSize: 30, ...props },
      global: { plugins: [authAs('MGR')] },
    });
  }
  const lastQuery = (w: ReturnType<typeof mountList>) => {
    const emitted = w.emitted('query-change')!;
    return emitted[emitted.length - 1][0];
  };

  it('renders Page X of Y from totalCount/pageSize and disables the pager at the bounds', async () => {
    const w = mountList({ page: 1 });
    expect(w.text()).toContain('Page 1 of 3');
    expect(w.text()).toContain('65 patients');
    const prev = w.findAll('button').find((b) => b.text().includes('Prev'))!;
    const next = w.findAll('button').find((b) => b.text().includes('Next'))!;
    expect(prev.attributes('disabled')).toBeDefined();
    expect(next.attributes('disabled')).toBeUndefined();

    await w.setProps({ page: 3 });
    expect(w.text()).toContain('Page 3 of 3');
    expect(w.findAll('button').find((b) => b.text().includes('Next'))!.attributes('disabled')).toBeDefined();
  });

  it('pager clicks emit query-change with the target page', async () => {
    const w = mountList({ page: 2 });
    await w.findAll('button').find((b) => b.text().includes('Next'))!.trigger('click');
    expect(lastQuery(w)).toEqual({ search: '', isActive: undefined, page: 3 });
    await w.findAll('button').find((b) => b.text().includes('Prev'))!.trigger('click');
    expect(lastQuery(w)).toEqual({ search: '', isActive: undefined, page: 1 });
  });

  it('the Active/Inactive tabs re-query with the isActive param (page reset to 1)', async () => {
    const w = mountList({ page: 2 });
    await w.findAll('button').find((b) => b.text() === 'Active')!.trigger('click');
    expect(lastQuery(w)).toEqual({ search: '', isActive: true, page: 1 });
    await w.findAll('button').find((b) => b.text() === 'Inactive')!.trigger('click');
    expect(lastQuery(w)).toEqual({ search: '', isActive: false, page: 1 });
    await w.findAll('button').find((b) => b.text() === 'All')!.trigger('click');
    expect(lastQuery(w)).toEqual({ search: '', isActive: undefined, page: 1 });
  });

  it('search input is debounced and restarts from page 1', async () => {
    vi.useFakeTimers();
    const w = mountList({ page: 2 });
    const input = w.find('input[type="text"]');
    await input.setValue('gar');
    await input.setValue('garcia');
    expect(w.emitted('query-change')).toBeUndefined(); // still inside the debounce window

    vi.advanceTimersByTime(300);
    await flushPromises();
    expect(w.emitted('query-change')).toHaveLength(1);
    expect(lastQuery(w)).toEqual({ search: 'garcia', isActive: undefined, page: 1 });
  });
});

describe('CaretakerList — pager math + query-change emits', () => {
  function mountList(props: Record<string, unknown> = {}) {
    return mount(CaretakerList, {
      props: { caretakers: [caretaker()], totalCount: 40, page: 1, pageSize: 30, ...props },
      global: { plugins: [authAs('MGR')] },
    });
  }

  it('pages and maps the tabs onto the isActive param', async () => {
    const w = mountList();
    expect(w.text()).toContain('Page 1 of 2');
    expect(w.text()).toContain('40 caretakers');

    await w.findAll('button').find((b) => b.text() === 'Inactive')!.trigger('click');
    let emitted = w.emitted('query-change')!;
    expect(emitted[emitted.length - 1][0]).toEqual({ search: '', isActive: false, page: 1 });

    await w.findAll('button').find((b) => b.text().includes('Next'))!.trigger('click');
    emitted = w.emitted('query-change')!;
    expect(emitted[emitted.length - 1][0]).toEqual({ search: '', isActive: false, page: 2 });
  });
});

// ── PatientsView — the view actually re-queries the server ──────────────────

describe('PatientsView — server round-trips', () => {
  function mountView() {
    return mount(PatientsView, {
      global: {
        plugins: [authAs('MGR')],
        stubs: {
          O2MobileNav: true, O2Sidebar: true, O2Header: true, O2Footer: true,
          PatientFormModal: true, PaymentFormModal: true, CrossAddChainModal: true,
          PatientCaretakerPanel: true, teleport: true,
        },
      },
    });
  }

  it('loads page 1 unfiltered on mount and renders the page rows', async () => {
    const w = mountView();
    await flushPromises();
    expect(getPatientsMock).toHaveBeenCalledWith({ search: '', isActive: undefined, page: 1 });
    expect(w.text()).toContain('Doe, John');
    expect(w.text()).toContain('65 patients');
  });

  it('tab clicks and pager clicks hit the server with the new query', async () => {
    const w = mountView();
    await flushPromises();

    await w.findAll('button').find((b) => b.text() === 'Inactive')!.trigger('click');
    await flushPromises();
    expect(getPatientsMock).toHaveBeenLastCalledWith({ search: '', isActive: false, page: 1 });

    await w.findAll('button').find((b) => b.text().includes('Next'))!.trigger('click');
    await flushPromises();
    expect(getPatientsMock).toHaveBeenLastCalledWith({ search: '', isActive: false, page: 2 });
  });
});

// ── migrated pickers — lookup wiring ─────────────────────────────────────────

describe('BookingFormModal — patient lookup typeahead', () => {
  it('searches the lookup endpoint and picking drives form.patientId (caretaker check fires)', async () => {
    vi.useFakeTimers();
    const w = mount(BookingFormModal, {
      props: { visible: false },
      global: { plugins: [authAs('MGR')], stubs: { teleport: true } },
    });
    await w.setProps({ visible: true });
    await flushPromises();

    await typeahead(w, 'booking-patient', 'doe');
    expect(lookupPatientsMock).toHaveBeenCalledWith('doe');
    await w.find('[data-testid="booking-patient-option"]').trigger('mousedown');
    await flushPromises();

    const vm = w.vm as unknown as { form: { patientId: number } };
    expect(vm.form.patientId).toBe(1);
    expect(getPatientCaretakersMock).toHaveBeenCalledWith(1); // WP-23 F10 check still rides the id
  });
});

describe('PaymentFormModal — caretaker lookup typeahead', () => {
  function mountModal(payment: PaymentRecord | null = null, preSelectedCaretakerId = 0) {
    return mount(PaymentFormModal, {
      props: { visible: false, payment, preSelectedCaretakerId },
      global: { plugins: [authAs('MGR')], stubs: { teleport: true } },
    });
  }

  it('searches the lookup endpoint and picking drives form.caretakerId', async () => {
    vi.useFakeTimers();
    const w = mountModal();
    await w.setProps({ visible: true });
    await flushPromises();

    await typeahead(w, 'payment-caretaker', 'del');
    expect(lookupCaretakersMock).toHaveBeenCalledWith('del');
    await w.find('[data-testid="payment-caretaker-option"]').trigger('mousedown');
    await flushPromises();

    expect((w.vm as unknown as { form: { caretakerId: number } }).form.caretakerId).toBe(9);
  });

  it('EDIT hydrates the selected card from the payment without clearing its allocations', async () => {
    const payment: PaymentRecord = {
      paymentId: 3, amount: 30, paymentDate: '2026-07-01T00:00:00', caretakerId: 9,
      caretakerName: 'Delgado, María', paymentType: { paymentTypeId: 1, abbreviation: 'EFT', name: 'Transfer' },
      checkNumber: null, totalAllocated: 30, unallocatedAmount: 0,
      allocations: [{ sessionPaymentId: 1, sessionId: 5, sessionDate: '', patientName: '', therapistName: '', amountAllocated: 30 }],
    };
    const w = mountModal(payment);
    await w.setProps({ visible: true });
    await flushPromises();

    expect(w.find('[data-testid="payment-caretaker-selected"]').text()).toContain('Delgado, María');
    const vm = w.vm as unknown as { form: { caretakerId: number }; allocations: Record<number, number> };
    expect(vm.form.caretakerId).toBe(9);
    expect(vm.allocations[5]).toBe(30); // hydration must not look like a caretaker change
  });
});

describe('CaretakerPatientsList — patient lookup excludes already-linked', () => {
  it('already-linked patients are filtered out of the typeahead results', async () => {
    vi.useFakeTimers();
    getCaretakerPatientsMock.mockResolvedValue([
      { patientId: 55, patientName: 'Herrera, Lucas', isPrimaryCaretaker: true, relationshipToPatient: null },
    ]);
    const w = mount(CaretakerPatientsList, {
      props: { caretaker: caretaker() },
      global: { plugins: [authAs('MGR')], stubs: { teleport: true } },
    });
    await flushPromises();

    await w.findAll('button').find((b) => b.text().includes('Link Patient'))!.trigger('click');
    await typeahead(w, 'link-entity', 'l');
    expect(lookupPatientsMock).toHaveBeenCalledWith('l');

    const options = w.findAll('[data-testid="link-entity-option"]');
    expect(options).toHaveLength(1); // Herrera (55) excluded — only Doe remains
    expect(options[0].text()).toContain('Doe, John');
  });
});

describe('PatientCaretakerPanel — caretaker lookup + link', () => {
  it('picks a caretaker via the typeahead and links caretaker-side', async () => {
    vi.useFakeTimers();
    getPatientCaretakersMock.mockResolvedValue([]);
    const w = mount(PatientCaretakerPanel, {
      props: { patient: patient({ patientId: 42 }) },
      global: { plugins: [authAs('MGR')], stubs: { teleport: true } },
    });
    await flushPromises();

    await w.findAll('button').find((b) => b.text().includes('Add Caretaker'))!.trigger('click');
    await typeahead(w, 'link-entity', 'del');
    expect(lookupCaretakersMock).toHaveBeenCalledWith('del');
    await w.find('[data-testid="link-entity-option"]').trigger('mousedown');
    await w.find('[data-testid="link-submit"]').trigger('click');
    await flushPromises();

    expect(linkPatientMock).toHaveBeenCalledWith(9, 42, true, null);
  });
});

describe('CaretakerStatementControls — caretaker lookup typeahead', () => {
  it('Generate stays disabled until a pick, then emits the picked id with the date range', async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn().mockResolvedValue([{ id: 9, name: 'Delgado, María' }]);
    const w = mount(CaretakerStatementControls, { props: { fetchOptions: fetchFn } });

    const generate = w.findAll('button').find((b) => b.text().includes('Generate Statement'))!;
    expect(generate.attributes('disabled')).toBeDefined();

    await typeahead(w, 'statement-caretaker', 'del');
    await w.find('[data-testid="statement-caretaker-option"]').trigger('mousedown');
    expect(generate.attributes('disabled')).toBeUndefined();

    await generate.trigger('click');
    const emitted = w.emitted('generate')!;
    expect(emitted[0][0]).toBe(9);
    expect(String(emitted[0][1])).toMatch(/^\d{4}-\d{2}-\d{2}$/); // from
    expect(String(emitted[0][2])).toMatch(/^\d{4}-\d{2}-\d{2}$/); // to
  });
});
