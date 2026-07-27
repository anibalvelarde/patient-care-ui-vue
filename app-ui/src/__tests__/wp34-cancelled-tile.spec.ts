// WP-34C — Dashboard tile: Cancelled / No-Show (punch-list DSH-1).
//
// One combined always-on tile on the O2 stat bar: headline = today's Cancelled (status id 3)
// + No-Show (status id 5), subtitle shows the split. Counted client-side from the already
// loaded day feed, keyed on appointmentStatusId (the FK id is the robust representation —
// statusName strings are admin-editable lookup values). Also covers the G4 grid rework
// (wrap-friendly auto-fit grid replaces the stats.length lg:grid-cols ladder) and the tile's
// deep-link into the EXISTING AppointmentsView Cancelled/No-Show filter tab.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils';
import { createPinia, setActivePinia, type Pinia } from 'pinia';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import type { Appointment } from '../interfaces/Appointment';
import type { DelinquentPatient } from '../interfaces/Delinquency';
import O2StatsBar from '../components/option02/O2StatsBar.vue';
import AppointmentsView from '../views/AppointmentsView.vue';

// ---- mocked route (AppointmentsView reads route.query.filter on mount) ----
const mockRoute = vi.hoisted(() => ({
  query: {} as Record<string, unknown>,
  path: '/appointments',
}));
vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}));

// ---- HTTP client mocks (every client the mounted trees new up) ----
const { getPendingSummaryMock, getPastDuePatientsMock, getSessionsMock, getUpcomingMock } =
  vi.hoisted(() => ({
    getPendingSummaryMock: vi.fn(),
    getPastDuePatientsMock: vi.fn(),
    getSessionsMock: vi.fn(),
    getUpcomingMock: vi.fn(),
  }));

vi.mock('../services/ServicePaymentsHttpClient', () => ({
  ServicePaymentsHttpClient: vi.fn().mockImplementation(() => ({
    getPendingSummary: getPendingSummaryMock,
  })),
}));

vi.mock('../services/PatientsHttpClient', () => ({
  PatientsHttpClient: vi.fn().mockImplementation(() => ({
    getPastDuePatients: getPastDuePatientsMock,
  })),
}));

vi.mock('../services/SessionsHttpClient', () => ({
  SessionsHttpClient: vi.fn().mockImplementation(() => ({
    getSessions: getSessionsMock,
    getUpcoming: getUpcomingMock,
  })),
}));

// ---- auth helpers (manifest-driven, per testing guide) ----
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

// ---- factories ----
function appt(overrides: Partial<Appointment> = {}): Appointment {
  return {
    sessionId: 1,
    sessionDate: '2026-07-27',
    sessionTime: '09:00',
    patient: 'Test Patient',
    therapist: 'Test Therapist',
    therapyTypes: 'ABA',
    amount: 50,
    discount: 0,
    amountPaid: 0,
    amountDue: 50,
    isPastDue: false,
    isPaidOff: false,
    notes: '',
    patientId: 1,
    therapistId: 1,
    time: '09:00',
    appointmentStatusId: 4,
    statusName: 'Completed',
    isConfirmed: true,
    siteId: 1,
    siteName: 'Main',
    specialtyTypeId: null,
    specialtyAbbreviation: null,
    specialtyName: null,
    isDiscovery: false,
    caretakerName: null,
    caretakerPhone: null,
    caretakerEmail: null,
    ...overrides,
  } as Appointment;
}

function delinquent(overrides: Partial<DelinquentPatient> = {}): DelinquentPatient {
  return { pastDueTotalAmount: 200, amountPaidSoFar: 50, ...overrides } as DelinquentPatient;
}

const WRAP_GRID_CLASS = 'lg:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]';

function mountBar(role: string, appointments: Appointment[]) {
  return mount(O2StatsBar, {
    props: { appointments },
    global: {
      plugins: [authAs(role)],
      stubs: { 'router-link': RouterLinkStub },
    },
  });
}

// unique sessionIds per row so :key stays stable
let nextId = 100;
function withStatus(appointmentStatusId: number, statusName = ''): Appointment {
  return appt({ sessionId: nextId++, appointmentStatusId, statusName });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRoute.query = {};
  // re-seed defaults AFTER clearing (clearAllMocks wipes the seeds; re-seeding also
  // overwrites any per-test mockRejectedValue implementations so they can't leak)
  getPendingSummaryMock.mockResolvedValue({ totalPending: 100, therapistCount: 2, sessionCount: 5 });
  getPastDuePatientsMock.mockResolvedValue([delinquent()]);
  getSessionsMock.mockResolvedValue([]);
  getUpcomingMock.mockResolvedValue([]);
});

describe('O2StatsBar — WP-34C Cancelled / No-Show tile', () => {
  it('shows the combined headline count with the split detail', async () => {
    const wrapper = mountBar('FD', [
      withStatus(3, 'Cancelled'),
      withStatus(3, 'Cancelled'),
      withStatus(3, 'Cancelled'),
      withStatus(5, 'NoShow'),
      withStatus(4, 'Completed'),
      withStatus(2, 'Confirmed'),
    ]);
    await flushPromises();

    const tile = wrapper.find('[data-testid="stat-cancelled-noshow"]');
    expect(tile.exists()).toBe(true);
    expect(tile.text()).toContain('Cancelled / No-Show');
    expect(wrapper.find('[data-testid="stat-cancelled-noshow-value"]').text()).toBe('4');
    expect(wrapper.find('[data-testid="stat-cancelled-noshow-subtitle"]').text())
      .toBe('3 cancelled · 1 no-show');
  });

  it('stays visible with 0 on a clean day (matches the other always-on tiles)', async () => {
    const wrapper = mountBar('FD', [withStatus(4, 'Completed'), withStatus(2, 'Confirmed')]);
    await flushPromises();

    expect(wrapper.find('[data-testid="stat-cancelled-noshow"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="stat-cancelled-noshow-value"]').text()).toBe('0');
    expect(wrapper.find('[data-testid="stat-cancelled-noshow-subtitle"]').text())
      .toBe('0 cancelled · 0 no-show');
  });

  it('keys on appointmentStatusId (3 and 5 only) — not on statusName', async () => {
    const wrapper = mountBar('FD', [
      withStatus(1, 'Proposed'),
      withStatus(2, 'Confirmed'),
      withStatus(4, 'Cancelled'), // lying statusName, id says Completed → NOT counted
      withStatus(6, 'CheckedIn'),
      withStatus(7, 'InTherapy'),
      withStatus(3, ''), // missing statusName, id says Cancelled → counted
      withStatus(5, ''), // missing statusName, id says NoShow → counted
    ]);
    await flushPromises();

    expect(wrapper.find('[data-testid="stat-cancelled-noshow-value"]').text()).toBe('2');
    expect(wrapper.find('[data-testid="stat-cancelled-noshow-subtitle"]').text())
      .toBe('1 cancelled · 1 no-show');
  });

  it('FD sees 5 tiles: the money tiles are claim-gated off, the new tile is not', async () => {
    const wrapper = mountBar('FD', [withStatus(3, 'Cancelled')]);
    await flushPromises();

    // one -value node per tile → tile count
    expect(wrapper.findAll('[data-testid$="-value"]').length).toBe(5);
    expect(wrapper.find('[data-testid="stat-cancelled-noshow"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="stat-pending-therapist-pay"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="stat-pending-caretaker-pay"]').exists()).toBe(false);
    // FD claims never trigger the gated fetches
    expect(getPendingSummaryMock).not.toHaveBeenCalled();
    expect(getPastDuePatientsMock).not.toHaveBeenCalled();
  });

  it('MGR sees all 7 tiles (both gated summaries load)', async () => {
    const wrapper = mountBar('MGR', [withStatus(3, 'Cancelled')]);
    await flushPromises();

    expect(wrapper.findAll('[data-testid$="-value"]').length).toBe(7);
    expect(wrapper.find('[data-testid="stat-cancelled-noshow"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="stat-pending-therapist-pay"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="stat-pending-caretaker-pay"]').exists()).toBe(true);
  });

  it('a failed gated summary just omits its tile (6-tile variant)', async () => {
    getPastDuePatientsMock.mockRejectedValue(new Error('boom'));
    const wrapper = mountBar('MGR', []);
    await flushPromises();

    expect(wrapper.findAll('[data-testid$="-value"]').length).toBe(6);
    expect(wrapper.find('[data-testid="stat-pending-therapist-pay"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="stat-pending-caretaker-pay"]').exists()).toBe(false);
  });

  it('G4: the grid is a static wrap-friendly auto-fit layout at every tile count — no ladder', async () => {
    // The old ladder keyed off stats.length (lg:grid-cols-6/-5/-4). With the always-on
    // 5th tile the reachable lengths are 5 (FD), 6 (one gated summary down), 7 (MGR/AM);
    // 4 is no longer reachable. The class must be identical — length-independent — in all
    // variants so any future tile count wraps cleanly too (mobile stays grid-cols-2).
    const variants: Array<[string, () => void]> = [
      ['FD-5', () => undefined],
      ['MGR-6', () => getPendingSummaryMock.mockRejectedValue(new Error('down'))],
      ['MGR-7', () => undefined],
    ];
    for (const [variant, seed] of variants) {
      seed();
      const wrapper = mountBar(variant.startsWith('FD') ? 'FD' : 'MGR', []);
      await flushPromises();
      const grid = wrapper.find('[data-testid="stats-grid"]');
      expect(grid.classes(), variant).toContain(WRAP_GRID_CLASS);
      expect(grid.classes(), variant).toContain('grid-cols-2');
      expect(grid.classes().join(' '), variant).not.toMatch(/lg:grid-cols-[4567]/);
      // re-seed for the next variant (per-test overrides must not leak forward)
      getPendingSummaryMock.mockResolvedValue({ totalPending: 100, therapistCount: 2, sessionCount: 5 });
    }
  });

  it('links to the existing Cancelled/No-Show filter tab on the Appointments view', async () => {
    const wrapper = mountBar('FD', [withStatus(3, 'Cancelled')]);
    await flushPromises();

    // FD has no money tiles, so the only router-link tile is the cancelled one
    const links = wrapper.findAllComponents(RouterLinkStub);
    expect(links.length).toBe(1);
    expect(links[0].props('to')).toEqual({ path: '/appointments', query: { filter: 'cancelled' } });
    expect(links[0].attributes('data-testid')).toBe('stat-cancelled-noshow');
  });
});

describe('AppointmentsView — ?filter=cancelled deep-link (WP-34C)', () => {
  const viewStubs = {
    O2MobileNav: true,
    O2Sidebar: true,
    O2Header: true,
    O2Footer: true,
    BookingFormModal: true,
    ActionsPanel: true,
    AppointmentsTable: true,
  };

  function seedDay() {
    getSessionsMock.mockResolvedValue([
      withStatus(4, 'Completed'),
      withStatus(3, 'Cancelled'),
      withStatus(5, 'NoShow'),
    ]);
    getUpcomingMock.mockResolvedValue([]);
  }

  it('pre-selects the existing Cancelled tab so the table shows only statuses 3 and 5', async () => {
    seedDay();
    mockRoute.query = { filter: 'cancelled' };
    const wrapper = mount(AppointmentsView, {
      global: { plugins: [authAs('FD')], stubs: viewStubs },
    });
    await flushPromises();

    const table = wrapper.findComponent({ name: 'AppointmentsTable' });
    const rows = table.props('appointments') as Appointment[];
    expect(rows.length).toBe(2);
    expect(rows.every((a) => a.appointmentStatusId === 3 || a.appointmentStatusId === 5)).toBe(true);
  });

  it('without the param the view still defaults to All', async () => {
    seedDay();
    const wrapper = mount(AppointmentsView, {
      global: { plugins: [authAs('FD')], stubs: viewStubs },
    });
    await flushPromises();

    const table = wrapper.findComponent({ name: 'AppointmentsTable' });
    expect((table.props('appointments') as Appointment[]).length).toBe(3);
  });
});
