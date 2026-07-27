// WP-40 (BK-1/BK-2/BK-3) — booking auto-money:
//   BK-1 — duration is a fixed select {30,40,45,60,90,120} (40 per the 2026-07-27 addendum).
//   BK-2 — Amount/Discount/ProviderAmt are DERIVED read-only displays: amount from the WP-39
//          price sheet (duration row → defaultAmount → G4 block), discount = exact-20% while
//          SENADIS is active at the session date else 0, provider from the therapist fee model.
//   On-site leg: checkbox only for offeredOnSite specialties; trip charge shown as its own line.
//   BK-3 — the ActionsPanel discount edit is gated on Sessions.Discount.Edit (AM/MGR);
//          the PUT omits duration (stored value kept) and providerAmount (server-derived).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia, type Pinia } from 'pinia';
import { mount, flushPromises } from '@vue/test-utils';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import type { Patient } from '../interfaces/Patient';
import type { Appointment } from '../interfaces/Appointment';
import BookingFormModal from '../components/appointments/BookingFormModal.vue';
import ActionsPanel from '../components/appointments/ActionsPanel.vue';

// ── ids / fixtures ───────────────────────────────────────────────────────────

const FLAGGED_ID = 1;
const UNFLAGGED_ID = 2;

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    patientId: UNFLAGGED_ID,
    userId: 10,
    patientName: 'Doe, John',
    medicalRecordNumber: 'NC26-0001',
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

// Specialty 5: priced rows for 30/60, defaultAmount fallback for other durations.
// Specialty 9: offeredOnSite (the dormant on-site leg, exercised here ahead of the flag flip).
// Specialty 2: NO price at all → the G4 missing-price block.
const SPECIALTIES = [
  {
    id: 5, abbreviation: 'TC', name: 'Conduct Therapy', description: null, sortOrder: 1,
    defaultAmount: 40, offeredOnSite: false, createdTimestamp: '', lastUpdatedTimestamp: '',
    durationPrices: [
      { durationMinutes: 30, amount: 25, effectiveFrom: '2026-01-01' },
      { durationMinutes: 60, amount: 45, effectiveFrom: '2026-01-01' },
    ],
  },
  {
    id: 9, abbreviation: 'DOM', name: 'Domiciliar Therapy', description: null, sortOrder: 2,
    defaultAmount: 30, offeredOnSite: true, createdTimestamp: '', lastUpdatedTimestamp: '',
    durationPrices: [{ durationMinutes: 60, amount: 50, effectiveFrom: '2026-01-01' }],
  },
  {
    id: 2, abbreviation: 'FS', name: 'Physiotherapy', description: null, sortOrder: 3,
    defaultAmount: null, offeredOnSite: false, createdTimestamp: '', lastUpdatedTimestamp: '',
    durationPrices: [],
  },
];

const { patientsClientMocks, lookupGetAllMock, createSessionMock, updateSessionMock, getSitesMock } = vi.hoisted(() => ({
  patientsClientMocks: {
    getPatient: vi.fn(),
    getPatientCaretakers: vi.fn(),
  },
  lookupGetAllMock: vi.fn(),
  createSessionMock: vi.fn().mockResolvedValue({}),
  updateSessionMock: vi.fn().mockResolvedValue(undefined),
  getSitesMock: vi.fn(),
}));

vi.mock('../services/PatientsHttpClient', () => ({
  PatientsHttpClient: vi.fn().mockImplementation(() => ({
    getPatient: patientsClientMocks.getPatient,
    getPatientCaretakers: patientsClientMocks.getPatientCaretakers,
    lookupPatients: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock('../services/TherapistsHttpClient', () => ({
  TherapistsHttpClient: vi.fn().mockImplementation(() => ({
    getTherapists: vi.fn().mockResolvedValue([
      // Flat-fee therapist (pct 0 ⇒ flat 25) and %-of-net therapist (0.50). Both qualified
      // for the fixture specialties so the specialty↔therapist filter keeps them selectable.
      { therapistId: 7, id: 7, therapistName: 'Flat, Fiona', feePerSession: 25, feePctPerSession: 0,
        specialties: [{ specialtyId: 5 }, { specialtyId: 9 }, { specialtyId: 2 }] },
      { therapistId: 8, id: 8, therapistName: 'Pct, Paula', feePerSession: 0, feePctPerSession: 0.5,
        specialties: [{ specialtyId: 5 }, { specialtyId: 9 }, { specialtyId: 2 }] },
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
    createSession: createSessionMock,
    updateSession: updateSessionMock,
  })),
}));

vi.mock('../services/SitesHttpClient', () => ({
  SitesHttpClient: vi.fn().mockImplementation(() => ({
    getSites: getSitesMock,
  })),
}));

vi.mock('vue-router', () => ({
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
  createSessionMock.mockResolvedValue({});
  updateSessionMock.mockResolvedValue(undefined);
  lookupGetAllMock.mockResolvedValue(SPECIALTIES);
  getSitesMock.mockResolvedValue([
    { siteId: 1, siteName: 'Main Clinic', onSiteTripChargeAmount: 25 },
  ]);
  patientsClientMocks.getPatient.mockImplementation(async (id: number) =>
    patient({ patientId: id, hasSenadisDiscount: id === FLAGGED_ID }));
  patientsClientMocks.getPatientCaretakers.mockResolvedValue([
    { caretakerId: 1, caretakerName: 'Care, Cara', isPrimaryCaretaker: true, relationshipToPatient: 'Mother' },
  ]);
});

// ── BookingFormModal ─────────────────────────────────────────────────────────

type BookingVm = {
  form: { patientId: number; therapistId: number; specialtyTypeId: number; duration: number; sessionDate: string };
  derivedAmount: number | null;
  derivedDiscount: number;
  derivedProviderAmount: number;
  amountSource: string;
  missingPrice: boolean;
  isValid: boolean;
  onSiteVisit: boolean;
  onSiteSiteId: number;
  handleSubmit: () => Promise<void>;
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

describe('BookingFormModal — BK-1 fixed duration select', () => {
  it('offers exactly 30/40/45/60/90/120 and defaults to 60', async () => {
    const wrapper = await openBookingModal(authAs('MGR'));

    const options = wrapper.find('[data-testid="duration-select"]').findAll('option');
    expect(options.map(o => Number(o.attributes('value')))).toEqual([30, 40, 45, 60, 90, 120]);
    expect((wrapper.vm as unknown as BookingVm).form.duration).toBe(60);
  });
});

describe('BookingFormModal — BK-2 derived read-only money', () => {
  it('derives Amount from the duration price row and re-derives when the duration changes', async () => {
    const wrapper = await openBookingModal(authAs('MGR'));
    const vm = wrapper.vm as unknown as BookingVm;

    vm.form.specialtyTypeId = 5;
    await flushPromises();
    expect(vm.derivedAmount).toBe(45);         // 60-min row
    expect(vm.amountSource).toBe('durationPrice');
    expect(wrapper.find('[data-testid="derived-amount"]').text()).toContain('45.00');

    vm.form.duration = 30;
    await flushPromises();
    expect(vm.derivedAmount).toBe(25);         // 30-min row

    vm.form.duration = 40;                     // no 40-min row → defaultAmount fallback + badge
    await flushPromises();
    expect(vm.derivedAmount).toBe(40);
    expect(vm.amountSource).toBe('defaultAmount');
    expect(wrapper.find('[data-testid="default-amount-badge"]').exists()).toBe(true);
  });

  it('renders money as read-only displays — no amount/discount/provider inputs for anyone', async () => {
    const wrapper = await openBookingModal(authAs('MGR'));

    expect(wrapper.find('[data-testid="derived-amount"]').element.tagName).toBe('P');
    expect(wrapper.find('[data-testid="derived-discount"]').element.tagName).toBe('P');
    expect(wrapper.find('[data-testid="derived-provider-amount"]').element.tagName).toBe('P');
    // The only number-ish inputs left are date/time/checkbox/select — no money inputs.
    expect(wrapper.findAll('input[type="number"]')).toHaveLength(0);
  });

  it('G4: a specialty with no price row and no default blocks submit with the message', async () => {
    const wrapper = await openBookingModal(authAs('MGR'));
    const vm = wrapper.vm as unknown as BookingVm;

    vm.form.specialtyTypeId = 2; // Physiotherapy — unpriced
    await flushPromises();

    expect(vm.missingPrice).toBe(true);
    expect(vm.isValid).toBe(false);
    const block = wrapper.find('[data-testid="missing-price-block"]');
    expect(block.exists()).toBe(true);
    expect(block.text()).toContain('No price configured for Physiotherapy at 60 min');
  });

  it('derives the provider fee from the therapist model — flat vs % of net', async () => {
    const wrapper = await openBookingModal(authAs('MGR'));
    const vm = wrapper.vm as unknown as BookingVm;

    vm.form.specialtyTypeId = 5; // 60-min row = 45
    vm.form.therapistId = 7;     // flat 25
    await flushPromises();
    expect(vm.derivedProviderAmount).toBe(25);

    vm.form.therapistId = 8;     // 50% of net (45 − 0)
    await flushPromises();
    expect(vm.derivedProviderAmount).toBe(22.5);
  });

  it('claim-gates the provider display: MGR sees it, FD does not', async () => {
    const mgr = await openBookingModal(authAs('MGR'));
    expect(mgr.find('[data-testid="derived-provider-amount"]').exists()).toBe(true);

    const fd = await openBookingModal(authAs('FD'));
    expect(fd.find('[data-testid="derived-provider-amount"]').exists()).toBe(false);
  });

  it('SENADIS patient: derived exact-20% discount rides into the submit payload', async () => {
    const wrapper = await openBookingModal(authAs('MGR'));
    const vm = wrapper.vm as unknown as BookingVm;

    vm.form.patientId = FLAGGED_ID;
    vm.form.specialtyTypeId = 5;   // 45.00
    vm.form.therapistId = 7;
    await flushPromises();

    expect(vm.derivedDiscount).toBe(9); // round(0.20 × 45, 2)
    expect(wrapper.find('[data-testid="senadis-applied-badge"]').exists()).toBe(true);

    vm.handleSubmit();
    await vi.waitFor(() => expect(createSessionMock).toHaveBeenCalled());
    expect(createSessionMock).toHaveBeenCalledWith(expect.objectContaining({
      amount: 45, discount: 9, duration: 60, specialtyTypeId: 5, isOnSiteVisit: false,
    }));
  });
});

describe('BookingFormModal — on-site leg (dormant until OfferedOnSite flips)', () => {
  it('shows the checkbox only for offeredOnSite specialties', async () => {
    const wrapper = await openBookingModal(authAs('MGR'));
    const vm = wrapper.vm as unknown as BookingVm;

    vm.form.specialtyTypeId = 5; // not offered on-site
    await flushPromises();
    expect(wrapper.find('[data-testid="onsite-checkbox"]').exists()).toBe(false);

    vm.form.specialtyTypeId = 9; // offeredOnSite
    await flushPromises();
    expect(wrapper.find('[data-testid="onsite-checkbox"]').exists()).toBe(true);
  });

  it('checked: loads sites, shows the trip charge as its own line, and submits isOnSiteVisit + siteId', async () => {
    const wrapper = await openBookingModal(authAs('MGR'));
    const vm = wrapper.vm as unknown as BookingVm;

    vm.form.patientId = UNFLAGGED_ID;
    vm.form.specialtyTypeId = 9; // 60-min row = 50
    vm.form.therapistId = 7;
    await flushPromises();

    vm.onSiteVisit = true;
    await flushPromises();
    expect(getSitesMock).toHaveBeenCalled();
    expect(vm.isValid).toBe(false); // no site chosen yet

    vm.onSiteSiteId = 1;
    await flushPromises();
    const chargeLine = wrapper.find('[data-testid="onsite-charge-line"]');
    expect(chargeLine.exists()).toBe(true);
    expect(chargeLine.text()).toContain('On-site visit charge: $25.00');
    expect(vm.isValid).toBe(true);

    vm.handleSubmit();
    await vi.waitFor(() => expect(createSessionMock).toHaveBeenCalled());
    expect(createSessionMock).toHaveBeenCalledWith(expect.objectContaining({
      amount: 50, isOnSiteVisit: true, siteId: 1,
    }));
  });
});

// ── ActionsPanel — BK-3 gated discount edit ──────────────────────────────────

function appointmentFixture(overrides: Partial<Appointment> = {}): Appointment {
  return {
    sessionId: 77,
    sessionDate: '2026-07-27',
    sessionTime: '09:00:00',
    patient: 'Doe, John',
    therapist: 'Flat, Fiona',
    therapyTypes: 'TC',
    amount: 45,
    discount: 9,
    amountPaid: 0,
    amountDue: 36,
    isPastDue: false,
    isPaidOff: false,
    notes: '',
    patientId: FLAGGED_ID,
    therapistId: 7,
    time: '09:00',
    appointmentStatusId: 1,
    statusName: 'Proposed',
    isConfirmed: false,
    siteId: 1,
    siteName: 'Main Clinic',
    specialtyTypeId: 5,
    specialtyAbbreviation: 'TC',
    specialtyName: 'Conduct Therapy',
    isDiscovery: false,
    caretakerName: 'Care, Cara',
    caretakerPhone: '555-0001',
    caretakerEmail: 'cara@example.com',
    providerAmount: 25,
    ...overrides,
  };
}

async function openFinancialEdit(role: string, appt: Appointment = appointmentFixture()) {
  const pinia = authAs(role);
  const wrapper = mount(ActionsPanel, {
    props: { visible: true, appointment: appt },
    global: { plugins: [pinia], stubs: { teleport: true } },
  });
  await flushPromises();
  await (wrapper.vm as unknown as { startEditFinancials: () => Promise<void> }).startEditFinancials();
  await flushPromises();
  return wrapper;
}

describe('ActionsPanel — BK-3 discount edit gating', () => {
  it('FD: discount is read-only with the manager hint; no provider input anywhere', async () => {
    const wrapper = await openFinancialEdit('FD');

    expect(wrapper.find('[data-testid="edit-discount-input"]').exists()).toBe(false);
    const readonly = wrapper.find('[data-testid="edit-discount-readonly"]');
    expect(readonly.exists()).toBe(true);
    expect(readonly.text()).toContain('9.00');
    expect(wrapper.text()).toContain('Discount edits need a Manager / Assistant Manager.');
    // FD lacks Appointments.ProviderAmount → no provider display either.
    expect(wrapper.find('[data-testid="edit-provider-display"]').exists()).toBe(false);
  });

  it('MGR: discount editable with the SENADIS floor hint; provider is display-only ("recomputed on save")', async () => {
    const wrapper = await openFinancialEdit('MGR');

    expect(wrapper.find('[data-testid="edit-discount-input"]').exists()).toBe(true);
    const hint = wrapper.find('[data-testid="edit-senadis-floor-hint"]');
    expect(hint.exists()).toBe(true);
    expect(hint.text()).toContain('$9.00'); // 20% of 45
    // The provider figure is shown (claim held) but not editable.
    expect(wrapper.find('[data-testid="edit-provider-display"]').exists()).toBe(true);
    expect(wrapper.find('input[data-testid="edit-provider-input"]').exists()).toBe(false);
  });

  it('MGR save: PUT omits duration (stored value kept) and providerAmount (server-derived)', async () => {
    const wrapper = await openFinancialEdit('MGR');
    const vm = wrapper.vm as unknown as {
      financialForm: { amount: number; discount: number };
      saveFinancials: () => Promise<void>;
    };

    vm.financialForm.discount = 15;
    await vm.saveFinancials();

    expect(updateSessionMock).toHaveBeenCalledTimes(1);
    const [id, payload] = updateSessionMock.mock.calls[0] as [number, Record<string, unknown>];
    expect(id).toBe(77);
    expect(payload.discount).toBe(15);
    expect(payload).not.toHaveProperty('duration');
    expect(payload).not.toHaveProperty('providerAmount');
  });

  it('no active SENADIS (unflagged patient): no floor hint for the editable discount', async () => {
    const wrapper = await openFinancialEdit('MGR', appointmentFixture({ patientId: UNFLAGGED_ID, discount: 0 }));

    expect(wrapper.find('[data-testid="edit-discount-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="edit-senadis-floor-hint"]').exists()).toBe(false);
  });
});
