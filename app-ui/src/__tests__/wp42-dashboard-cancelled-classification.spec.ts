// WP-42C cherry-pick (quick fix, owner 2026-07-28) — dashboard payment classification is
// appointment-status-AWARE:
//   - O2StatsBar: "Pending Payment" / "Paid Off" / "Past Due" buckets exclude Cancelled (3)
//     and No-Show (5) rows — those have their own WP-34 tile. "Today's Appointments" total
//     deliberately still includes them (known quirk, ruled out of scope in WP-34).
//   - O2Appointments rows: a cancelled/no-show row shows its APPOINTMENT state chip
//     ("Cancelled"/"No Show", statusHelpers palette) — never a "Pending" chip and never a
//     Pay button, even when a pre-WP-42 legacy row still carries an amount due.
// Same id predicate as WP-34 (appointmentStatusId — statusName is admin-editable).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils';
import { createPinia, setActivePinia, type Pinia } from 'pinia';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import type { Appointment } from '../interfaces/Appointment';
import O2StatsBar from '../components/option02/O2StatsBar.vue';
import O2Appointments from '../components/option02/O2Appointments.vue';

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
let nextId = 500;
function appt(overrides: Partial<Appointment> = {}): Appointment {
  return {
    sessionId: nextId++,
    sessionDate: '2026-07-28',
    sessionTime: '09:00:00',
    patient: 'Doe, John',
    therapist: 'Smith, Jane',
    therapyTypes: 'TC',
    amount: 100,
    discount: 0,
    amountPaid: 0,
    amountDue: 100,
    isPastDue: false,
    isPaidOff: false,
    notes: '',
    patientId: 1,
    therapistId: 1,
    time: '09:00',
    appointmentStatusId: 1,
    statusName: 'Proposed',
    isConfirmed: false,
    siteId: 1,
    siteName: 'Main',
    specialtyTypeId: 5,
    specialtyAbbreviation: 'TC',
    specialtyName: 'Conduct Therapy',
    isDiscovery: false,
    caretakerName: null,
    caretakerPhone: null,
    caretakerEmail: null,
    ...overrides,
  } as Appointment;
}

// A zeroed cancellation (the 12339/12340 shape): status 3, all money 0, NOT paid-off.
const zeroedCancelled = () =>
  appt({ appointmentStatusId: 3, statusName: 'Cancelled', amount: 0, amountDue: 0, isPaidOff: false });

beforeEach(() => {
  vi.clearAllMocks();
  getPendingSummaryMock.mockResolvedValue({ totalPending: 0, therapistCount: 0, sessionCount: 0 });
  getPastDuePatientsMock.mockResolvedValue([]);
  getSessionsMock.mockResolvedValue([]);
  getUpcomingMock.mockResolvedValue([]);
});

// ---- O2StatsBar: status-aware payment buckets ----

function mountBar(appointments: Appointment[]) {
  return mount(O2StatsBar, {
    props: { appointments },
    global: { plugins: [authAs('MGR')], stubs: { 'router-link': RouterLinkStub } },
  });
}

const tileValue = (wrapper: ReturnType<typeof mountBar>, testId: string) =>
  wrapper.find(`[data-testid="${testId}"]`).text();

describe('O2StatsBar — payment buckets exclude cancelled/no-show', () => {
  it('a zeroed cancelled session counts in Cancelled/No-Show but NOT in Pending Payment', async () => {
    const wrapper = mountBar([zeroedCancelled(), appt()]); // 1 cancelled + 1 live proposed
    await flushPromises();

    expect(tileValue(wrapper, 'stat-pending-payment')).toContain('1'); // the live one only
    expect(tileValue(wrapper, 'stat-cancelled-noshow')).toContain('1');
    expect(tileValue(wrapper, 'stat-todays-appointments')).toContain('2'); // total keeps the known quirk
  });

  it('a cancelled day alone shows Pending Payment 0 (the owner-reported case)', async () => {
    const wrapper = mountBar([zeroedCancelled()]);
    await flushPromises();

    expect(tileValue(wrapper, 'stat-pending-payment')).toContain('0');
    expect(tileValue(wrapper, 'stat-cancelled-noshow')).toContain('1');
  });

  it('a paid-then-cancelled legacy row does not inflate Paid Off; a no-show row leaves Past Due alone', async () => {
    const wrapper = mountBar([
      appt({ appointmentStatusId: 3, statusName: 'Cancelled', isPaidOff: true, amountDue: 0 }),
      appt({ appointmentStatusId: 5, statusName: 'NoShow', isPastDue: true }),
      appt({ isPaidOff: true, amountDue: 0 }), // live paid session
    ]);
    await flushPromises();

    expect(tileValue(wrapper, 'stat-paid-off')).toContain('1');   // live paid only
    expect(tileValue(wrapper, 'stat-past-due')).toContain('0');   // no-show excluded
    expect(tileValue(wrapper, 'stat-cancelled-noshow')).toContain('2');
  });
});

// ---- O2Appointments: row chips ----

async function mountPanel(appointments: Appointment[]) {
  getSessionsMock.mockResolvedValue(appointments);
  const wrapper = mount(O2Appointments, {
    props: { selectedDate: '2026-07-28' },
    global: { plugins: [authAs('MGR')] },
  });
  await flushPromises();
  return wrapper;
}

describe('O2Appointments — cancelled/no-show rows show the appointment state, never payment chips', () => {
  it('a zeroed cancelled row shows a "Cancelled" chip — not the gray "Pending" chip', async () => {
    const cancelled = zeroedCancelled();
    const wrapper = await mountPanel([cancelled]);

    const chip = wrapper.find(`[data-testid="appt-status-chip-${cancelled.sessionId}"]`);
    expect(chip.exists()).toBe(true);
    expect(chip.text()).toBe('Cancelled');
    expect(wrapper.text()).not.toContain('Pending');
  });

  it('a legacy cancelled row STILL carrying money gets no Pay button (and no Past Due chip)', async () => {
    const legacy = appt({ appointmentStatusId: 3, statusName: 'Cancelled', amount: 100, amountDue: 100, isPastDue: true });
    const wrapper = await mountPanel([legacy]);

    expect(wrapper.find(`[data-testid="appt-status-chip-${legacy.sessionId}"]`).text()).toBe('Cancelled');
    expect(wrapper.text()).not.toContain('Pay');
    expect(wrapper.text()).not.toContain('Past Due');
  });

  it('a no-show row shows a "No Show" chip; live rows keep their payment chips', async () => {
    const noShow = appt({ appointmentStatusId: 5, statusName: 'NoShow' });
    const live = appt({ amountDue: 100 });
    const wrapper = await mountPanel([noShow, live]);

    expect(wrapper.find(`[data-testid="appt-status-chip-${noShow.sessionId}"]`).text()).toBe('No Show');
    expect(wrapper.find(`[data-testid="appt-status-chip-${live.sessionId}"]`).exists()).toBe(false);
    expect(wrapper.text()).toContain('Pay'); // the live row's Pay button survives
  });
});
