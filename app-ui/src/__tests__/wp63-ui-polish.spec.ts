// WP-63C — UI polish pack (owner walkthrough findings):
//   C1. Schedule matrix shows the status LABEL ("Checked In"), not the wire name ("CheckedIn").
//   C2. Wire times ("08:00:00") render as "8:00 AM" — formatWireTime() in utils/localDate.
//   C3. Caretaker relationship shows its label ("Legal Guardian"), not "Legal-Guardian".
//   C4. The "Proposed" status button is gone (it actually CONFIRMED the session).
//   C5. Record Payment allocation rows show time, specialty and status; $0-due rows are skipped.
//   C6. Run Payroll asks for confirmation before paying.
//   C7. Caretaker statement: Cancelled / Waived / No Show beat the money status.
//   C8. Therapist statement: status labels + an accurate pro-forma note.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia, type Pinia } from 'pinia';
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import type { Appointment } from '../interfaces/Appointment';
import type { ScheduleMatrixResponse } from '../interfaces/ScheduleMatrix';
import type { Patient } from '../interfaces/Patient';
import type { Caretaker } from '../interfaces/Caretaker';
import type { PaymentRecord, PaymentTypeInfo, UnpaidSessionSummary } from '../interfaces/Payment';
import type { PayrollPreviewTherapist } from '../interfaces/ServicePayment';
import type { AccountStatement, StatementCharge } from '../interfaces/Statement';
import type { TherapistStatement, TherapistStatementSession } from '../interfaces/TherapistStatement';
import { SessionStatus, SessionStatusName } from '../constants/sessionStatus';
import { CaretakerRelationship, getRelationshipLabel } from '../constants/caretakerRelationships';
import { formatWireTime } from '../utils/localDate';
import ScheduleMatrix from '../components/schedule/ScheduleMatrix.vue';
import AppointmentsTable from '../components/appointments/AppointmentsTable.vue';
import ActionsPanel from '../components/appointments/ActionsPanel.vue';
import PatientCaretakerPanel from '../components/patients/PatientCaretakerPanel.vue';
import CaretakerPatientsList from '../components/caretakers/CaretakerPatientsList.vue';
import CaretakerStatementScreen from '../components/statements/CaretakerStatementScreen.vue';
import TherapistStatementScreen from '../components/statements/TherapistStatementScreen.vue';
import PaymentFormModal from '../components/payments/PaymentFormModal.vue';
import RunPayrollWizard from '../components/service-payments/RunPayrollWizard.vue';

// ── hoisted client mocks ─────────────────────────────────────────────────────

const {
  sessionsClientMocks, patientsClientMocks, sitesClientMocks, caretakersClientMocks,
  paymentsClientMocks, servicePaymentsClientMocks,
} = vi.hoisted(() => ({
  sessionsClientMocks: {
    confirmSession: vi.fn(), completeSession: vi.fn(), checkInSession: vi.fn(),
    startTherapy: vi.fn(), cancelSession: vi.fn(), noShowSession: vi.fn(), updateSession: vi.fn(),
  },
  patientsClientMocks: {
    getPatient: vi.fn(), getPatientCaretakers: vi.fn(), lookupPatients: vi.fn(),
  },
  sitesClientMocks: { getSite: vi.fn() },
  caretakersClientMocks: {
    getCaretakerPatients: vi.fn(), lookupCaretakers: vi.fn(), getCaretaker: vi.fn(),
    unlinkPatient: vi.fn(), linkPatient: vi.fn(),
  },
  paymentsClientMocks: {
    getPaymentTypes: vi.fn(), getUnpaidSessions: vi.fn(), createPayment: vi.fn(), updatePayment: vi.fn(),
  },
  servicePaymentsClientMocks: {
    getQuincena: vi.fn(), getPayrollPreview: vi.fn(), runBatchPayroll: vi.fn(),
  },
}));

vi.mock('../services/SessionsHttpClient', () => ({
  SessionsHttpClient: vi.fn().mockImplementation(() => ({ ...sessionsClientMocks })),
}));
vi.mock('../services/PatientsHttpClient', () => ({
  PatientsHttpClient: vi.fn().mockImplementation(() => ({ ...patientsClientMocks })),
}));
vi.mock('../services/SitesHttpClient', () => ({
  SitesHttpClient: vi.fn().mockImplementation(() => ({ ...sitesClientMocks })),
}));
vi.mock('../services/CaretakersHttpClient', () => ({
  CaretakersHttpClient: vi.fn().mockImplementation(() => ({ ...caretakersClientMocks })),
}));
vi.mock('../services/PaymentsHttpClient', () => ({
  PaymentsHttpClient: vi.fn().mockImplementation(() => ({ ...paymentsClientMocks })),
}));
vi.mock('../services/ServicePaymentsHttpClient', () => ({
  ServicePaymentsHttpClient: vi.fn().mockImplementation(() => ({ ...servicePaymentsClientMocks })),
}));
// ActionsPanel + CaretakerPatientsList call useRouter(); this spec installs no router.
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: vi.fn() }),
}));

// ── auth helpers (manifest-driven, per testing guide) ────────────────────────

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

// ── factories (synthetic people only) ────────────────────────────────────────

function appointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    sessionId: 42, sessionDate: '2026-11-20', sessionTime: '08:00:00',
    patient: 'Testpatient, Ana', therapist: 'Testtherapist, Bea', therapyTypes: 'TL',
    amount: 85, discount: 0, amountPaid: 0, amountDue: 85,
    isPastDue: false, isPaidOff: false, notes: '',
    patientId: 7, therapistId: 3, time: '08:00',
    appointmentStatusId: SessionStatus.Confirmed, statusName: SessionStatusName.Confirmed, isConfirmed: true,
    siteId: 1, siteName: 'Main Clinic',
    specialtyTypeId: 6, specialtyAbbreviation: 'TL', specialtyName: 'Language Therapy',
    isDiscovery: false,
    caretakerName: null, caretakerPhone: null, caretakerEmail: null,
    ...overrides,
  };
}

const fullPatient: Patient = {
  patientId: 42, userId: 1, patientName: 'Testpatient, Ana',
  medicalRecordNumber: 'NC26-0001', cedula: '8-000-0000', dateOfBirth: '2018-01-01T00:00:00',
  email: null, phoneNumber: null, gender: 'Female', isActive: true,
  hasCompletedDiscovery: false, createdTimestamp: '2026-11-01T00:00:00', caretakers: [],
};
const fullCaretaker: Caretaker = {
  caretakerId: 10, userId: 2, caretakerName: 'Testcaretaker, Cruz',
  email: null, phoneNumber: null, notes: '', createdTimestamp: '2026-11-01T00:00:00',
  lastUpdated: '2026-11-01T00:00:00', isActive: true, patients: [],
};

function charge(overrides: Partial<StatementCharge> = {}): StatementCharge {
  return {
    sessionId: 1, sessionDate: '2026-11-03', patientName: 'Testpatient, Ana',
    therapistName: 'Testtherapist, Bea', therapyType: 'TL',
    amount: 50, discountAmount: 0, netCharge: 50, amountPaid: 0, amountDue: 50,
    isPastDue: false, paymentsApplied: [],
    statusName: SessionStatusName.Completed, isFeeWaived: false,
    ...overrides,
  };
}

function accountStatement(charges: StatementCharge[], relationship = CaretakerRelationship.Mother as string): AccountStatement {
  return {
    caretakerId: 10, caretakerName: 'Testcaretaker, Cruz', statementDate: '2026-11-26',
    periodStart: '2026-11-01', periodEnd: '2026-11-30',
    patients: [{ patientId: 42, patientName: 'Testpatient, Ana', isPrimaryCaretaker: true, relationshipToPatient: relationship }],
    charges, payments: [],
    summary: {
      totalCharges: 0, totalDiscounts: 0, totalNetCharges: 0, totalPayments: 0,
      outstandingBalance: 0, pastDueAmount: 0, pastDueSessionCount: 0,
    },
  };
}

function tSession(overrides: Partial<TherapistStatementSession> = {}): TherapistStatementSession {
  return {
    sessionId: 1, sessionDate: '2026-11-03', sessionTime: '13:30:00', therapyType: 'TL',
    amount: 50, discountAmount: 0, providerAmount: 0,
    statusName: SessionStatusName.NoShow, isBillable: false,
    ...overrides,
  };
}

function therapistStatement(sessions: TherapistStatementSession[], isProForma = true): TherapistStatement {
  return {
    therapistId: 3, therapistName: 'Testtherapist, Bea', statementDate: '2026-11-26',
    periodStart: '2026-11-01', periodEnd: '2026-11-15', isProForma,
    patients: [{
      patientId: 42, patientName: 'Testpatient, Ana', sessions,
      subtotalFee: 0, subtotalDiscount: 0, subtotalProviderAmount: 0, completedCount: 0, nonBillableCount: 1,
    }],
    servicePayments: [],
    summary: {
      totalCompletedSessions: 0, totalNonBillableSessions: 1, totalFee: 0, totalDiscount: 0,
      totalProviderAmount: 0, totalServicePaymentsApplied: 0, estimatedAmountDue: 0,
    },
  };
}

function unpaid(overrides: Partial<UnpaidSessionSummary> = {}): UnpaidSessionSummary {
  return {
    sessionId: 5, sessionDate: '2026-11-03', sessionTime: '08:00:00',
    patientId: 42, patientName: 'Testpatient, Ana', therapistName: 'Testtherapist, Bea',
    amount: 50, discountAmount: 0, amountPaid: 0, amountDue: 50, isPastDue: false,
    specialtyName: 'Language Therapy', statusName: SessionStatusName.Completed,
    ...overrides,
  };
}

const PAYMENT_TYPES: PaymentTypeInfo[] = [{ paymentTypeId: 1, abbreviation: 'EFT', name: 'Transfer' }];

function previewRow(overrides: Partial<PayrollPreviewTherapist> = {}): PayrollPreviewTherapist {
  return {
    therapistId: 3, therapistName: 'Testtherapist, Bea', sessionCount: 2, totalRemaining: 40,
    paidSessionCount: 0, paidTotal: 0, sessions: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionsClientMocks.confirmSession.mockResolvedValue(appointment());
  patientsClientMocks.getPatient.mockResolvedValue({ patientId: 7, hasSenadisDiscount: false });
  patientsClientMocks.lookupPatients.mockResolvedValue([]);
  caretakersClientMocks.lookupCaretakers.mockResolvedValue([]);
  paymentsClientMocks.getPaymentTypes.mockResolvedValue(PAYMENT_TYPES);
  paymentsClientMocks.getUnpaidSessions.mockResolvedValue([]);
  servicePaymentsClientMocks.getQuincena.mockResolvedValue({ from: '2026-11-01', to: '2026-11-15' });
  servicePaymentsClientMocks.getPayrollPreview.mockResolvedValue([
    previewRow(),
    previewRow({ therapistId: 4, therapistName: 'Testtherapist, Dora', totalRemaining: 60.5 }),
  ]);
  servicePaymentsClientMocks.runBatchPayroll.mockResolvedValue({ payments: [], therapistCount: 2, totalPaid: 100.5 });
});

// ── C2: formatWireTime helper ────────────────────────────────────────────────

describe('C2 — formatWireTime', () => {
  it('renders HH:mm:ss and HH:mm as 12-hour time without seconds', () => {
    expect(formatWireTime('08:00:00')).toBe('8:00 AM');
    expect(formatWireTime('08:00')).toBe('8:00 AM');
    expect(formatWireTime('13:30:00')).toBe('1:30 PM');
    expect(formatWireTime('12:05:00')).toBe('12:05 PM');
    expect(formatWireTime('00:15:00')).toBe('12:15 AM');
  });

  it('empty input renders as an empty string', () => {
    expect(formatWireTime('')).toBe('');
    expect(formatWireTime(null)).toBe('');
    expect(formatWireTime(undefined)).toBe('');
  });

  it('unparseable input is returned unchanged', () => {
    expect(formatWireTime('soon')).toBe('soon');
    expect(formatWireTime('25:00:00')).toBe('25:00:00');
  });
});

// ── C1: schedule matrix status label ─────────────────────────────────────────

describe('C1 — ScheduleMatrix slot shows the status label', () => {
  it('a CheckedIn slot reads "Checked In"', async () => {
    const matrix: ScheduleMatrixResponse = {
      weekStart: '2026-11-16', weekEnd: '2026-11-21', siteId: 1, siteName: 'Main Clinic',
      therapists: [{
        therapistId: 3, therapistName: 'Testtherapist, Bea', specialties: [],
        slots: [{
          date: '2026-11-16', time: '09:00:00', sessionId: 42, patientName: 'Testpatient, Ana',
          specialtyAbbreviation: 'TL', appointmentStatusId: SessionStatus.CheckedIn,
          statusName: SessionStatusName.CheckedIn,
        }],
      }],
    };
    const wrapper = mount(ScheduleMatrix, { props: { matrix } });
    await flushPromises();
    expect(wrapper.find('[data-testid="matrix-slot-status"]').text()).toBe('Checked In');
  });
});

// ── C2: AppointmentsTable time ───────────────────────────────────────────────

describe('C2 — AppointmentsTable shows a friendly time', () => {
  it('08:00:00 renders as 8:00 AM', () => {
    const wrapper = mount(AppointmentsTable, {
      props: { appointments: [appointment()] },
      global: { plugins: [authAs('FD')] },
    });
    expect(wrapper.find('[data-testid="appt-time"]').text()).toBe('8:00 AM');
  });
});

// ── C3: relationship labels ──────────────────────────────────────────────────

describe('C3 — relationship labels', () => {
  it('getRelationshipLabel maps known values and passes unknown ones through', () => {
    expect(getRelationshipLabel(CaretakerRelationship.LegalGuardian)).toBe('Legal Guardian');
    expect(getRelationshipLabel(CaretakerRelationship.HiredHelp)).toBe('Hired Help');
    expect(getRelationshipLabel('Godparent')).toBe('Godparent');
  });

  it('PatientCaretakerPanel shows "Legal Guardian" and keeps the "No relationship" fallback', async () => {
    patientsClientMocks.getPatientCaretakers.mockResolvedValue([
      { caretakerId: 10, caretakerName: 'Testcaretaker, Cruz', relationshipToPatient: CaretakerRelationship.LegalGuardian, isPrimaryCaretaker: true },
      { caretakerId: 11, caretakerName: 'Testcaretaker, Eva', relationshipToPatient: null, isPrimaryCaretaker: false },
    ]);
    const wrapper = mount(PatientCaretakerPanel, {
      props: { patient: fullPatient },
      global: { plugins: [authAs('FD')], stubs: { teleport: true } },
    });
    await flushPromises();
    const labels = wrapper.findAll('[data-testid="caretaker-relationship"]').map((w) => w.text());
    expect(labels).toEqual(['Legal Guardian', 'No relationship']);
  });

  it('CaretakerPatientsList shows "Legal Guardian"', async () => {
    caretakersClientMocks.getCaretakerPatients.mockResolvedValue([
      { patientId: 42, patientName: 'Testpatient, Ana', relationshipToPatient: CaretakerRelationship.LegalGuardian, isPrimaryCaretaker: true },
    ]);
    const wrapper = mount(CaretakerPatientsList, {
      props: { caretaker: fullCaretaker },
      global: { plugins: [authAs('FD')], stubs: { teleport: true } },
    });
    await flushPromises();
    expect(wrapper.find('[data-testid="patient-relationship"]').text()).toBe('Legal Guardian');
  });

  it('CaretakerStatementScreen shows "(Legal Guardian)"', () => {
    const wrapper = mount(CaretakerStatementScreen, {
      props: { statement: accountStatement([], CaretakerRelationship.LegalGuardian) },
    });
    expect(wrapper.find('[data-testid="statement-patient-relationship"]').text()).toBe('(Legal Guardian)');
  });
});

// ── C4: no "Proposed" status button ──────────────────────────────────────────

describe('C4 — ActionsPanel offers no "Proposed" status button', () => {
  async function openPanel(statusId: number, statusName: string) {
    const wrapper = mount(ActionsPanel, {
      props: { visible: true, appointment: appointment({ appointmentStatusId: statusId, statusName }) },
      global: { plugins: [authAs('MGR')], stubs: { teleport: true } },
    });
    await flushPromises();
    return wrapper;
  }
  const actionIds = (w: Awaited<ReturnType<typeof openPanel>>) =>
    w.findAll('[data-testid^="status-action-"]').map((b) => b.attributes('data-testid'));

  it.each([
    [SessionStatus.Confirmed, SessionStatusName.Confirmed],
    [SessionStatus.CheckedIn, SessionStatusName.CheckedIn],
    [SessionStatus.InTherapy, SessionStatusName.InTherapy],
  ])('status %i (%s) has no Proposed button', async (id, name) => {
    const w = await openPanel(id, name);
    expect(w.find(`[data-testid="status-action-${SessionStatus.Proposed}"]`).exists()).toBe(false);
  });

  it('the other transitions are unaffected (Confirmed session)', async () => {
    const w = await openPanel(SessionStatus.Confirmed, SessionStatusName.Confirmed);
    expect(actionIds(w)).toEqual([
      `status-action-${SessionStatus.CheckedIn}`,
      `status-action-${SessionStatus.InTherapy}`,
      `status-action-${SessionStatus.Completed}`,
      `status-action-${SessionStatus.NoShow}`,
    ]);
  });

  it('a CheckedIn session still offers Confirmed, which confirms', async () => {
    const w = await openPanel(SessionStatus.CheckedIn, SessionStatusName.CheckedIn);
    await w.find(`[data-testid="status-action-${SessionStatus.Confirmed}"]`).trigger('click');
    await flushPromises();
    expect(sessionsClientMocks.confirmSession).toHaveBeenCalledTimes(1);
  });
});

// ── C5: payment allocation rows ──────────────────────────────────────────────

describe('C5 — Record Payment allocation rows', () => {
  async function openStep2(sessions: UnpaidSessionSummary[]) {
    paymentsClientMocks.getUnpaidSessions.mockResolvedValue(sessions);
    const payment: PaymentRecord = {
      paymentId: 3, amount: 50, paymentDate: '2026-11-20T00:00:00', caretakerId: 10,
      caretakerName: 'Testcaretaker, Cruz', paymentType: PAYMENT_TYPES[0],
      checkNumber: null, totalAllocated: 0, unallocatedAmount: 50, allocations: [],
    };
    const wrapper = mount(PaymentFormModal, {
      props: { visible: false, payment },
      global: { plugins: [authAs('MGR')], stubs: { teleport: true } },
    });
    await wrapper.setProps({ visible: true });
    await flushPromises();
    await wrapper.findAll('button').find((b) => b.text() === 'Next')!.trigger('click');
    await flushPromises();
    return wrapper;
  }

  it('each row shows time, specialty and the status label', async () => {
    const w = await openStep2([unpaid({ statusName: SessionStatusName.NoShow })]);
    const row = w.find('[data-testid="unpaid-session-row"]');
    expect(row.find('[data-testid="unpaid-session-time"]').text()).toBe('8:00 AM');
    expect(row.find('[data-testid="unpaid-session-specialty"]').text()).toBe('Language Therapy');
    expect(row.find('[data-testid="unpaid-session-status"]').text()).toBe('No Show');
  });

  it('tolerates an older API without specialtyName/statusName', async () => {
    const legacy = unpaid();
    delete legacy.specialtyName;
    delete legacy.statusName;
    const w = await openStep2([legacy]);
    const row = w.find('[data-testid="unpaid-session-row"]');
    expect(row.find('[data-testid="unpaid-session-time"]').text()).toBe('8:00 AM');
    expect(row.find('[data-testid="unpaid-session-specialty"]').exists()).toBe(false);
    expect(row.find('[data-testid="unpaid-session-status"]').exists()).toBe(false);
  });

  it('skips sessions with nothing left to pay', async () => {
    const w = await openStep2([
      unpaid({ sessionId: 5 }),
      unpaid({ sessionId: 6, amountDue: 0 }),
      unpaid({ sessionId: 7, amountDue: 0.004 }),
    ]);
    expect(w.findAll('[data-testid="unpaid-session-row"]')).toHaveLength(1);
  });
});

// ── C6: Run Payroll confirm step ─────────────────────────────────────────────

describe('C6 — Run Payroll asks before paying', () => {
  async function openPreview() {
    const wrapper = mount(RunPayrollWizard, {
      props: { paymentTypes: PAYMENT_TYPES },
      global: { plugins: [authAs('MGR')], stubs: { RouterLink: RouterLinkStub } },
    });
    await flushPromises();
    await wrapper.find('[data-testid="payroll-preview-btn"]').trigger('click');
    await flushPromises();
    return wrapper;
  }

  it('first click shows the confirm line and does NOT pay', async () => {
    const w = await openPreview();
    await w.find('[data-testid="payroll-run-btn"]').trigger('click');
    await flushPromises();
    expect(servicePaymentsClientMocks.runBatchPayroll).not.toHaveBeenCalled();
    expect(w.find('[data-testid="payroll-confirm-line"]').text()).toBe('Pay 2 therapists a total of $100.50?');
  });

  it('Confirm pays', async () => {
    const w = await openPreview();
    await w.find('[data-testid="payroll-run-btn"]').trigger('click');
    await w.find('[data-testid="payroll-confirm-btn"]').trigger('click');
    await flushPromises();
    expect(servicePaymentsClientMocks.runBatchPayroll).toHaveBeenCalledTimes(1);
    expect(servicePaymentsClientMocks.runBatchPayroll.mock.calls[0][0].therapistIds).toEqual([3, 4]);
  });

  it('Cancel backs out without paying', async () => {
    const w = await openPreview();
    await w.find('[data-testid="payroll-run-btn"]').trigger('click');
    await w.find('[data-testid="payroll-cancel-btn"]').trigger('click');
    await flushPromises();
    expect(servicePaymentsClientMocks.runBatchPayroll).not.toHaveBeenCalled();
    expect(w.find('[data-testid="payroll-confirm"]').exists()).toBe(false);
    expect(w.find('[data-testid="payroll-run-btn"]').exists()).toBe(true);
  });
});

// ── C7: caretaker statement status ───────────────────────────────────────────

describe('C7 — caretaker statement status column', () => {
  const statusOf = (c: StatementCharge) =>
    mount(CaretakerStatementScreen, { props: { statement: accountStatement([c]) } })
      .find('[data-testid="statement-charge-status"]').text();

  it('a cancelled $0 session reads "Cancelled", not "Paid"', () => {
    expect(statusOf(charge({ statusName: SessionStatusName.Cancelled, amount: 0, netCharge: 0, amountDue: 0 }))).toBe('Cancelled');
  });

  it('a waived fee reads "Waived"', () => {
    expect(statusOf(charge({ statusName: SessionStatusName.NoShow, isFeeWaived: true, amountDue: 0 }))).toBe('Waived');
  });

  it('a no-show with nothing due reads "No Show"', () => {
    expect(statusOf(charge({ statusName: SessionStatusName.NoShow, amountDue: 0 }))).toBe('No Show');
  });

  it('a no-show with its fee still due keeps the money status', () => {
    expect(statusOf(charge({ statusName: SessionStatusName.NoShow, amountDue: 50 }))).toBe('Open');
    expect(statusOf(charge({ statusName: SessionStatusName.NoShow, amountDue: 50, isPastDue: true }))).toBe('Past Due');
  });

  it('ordinary sessions keep Paid / Open / Past Due', () => {
    expect(statusOf(charge({ amountDue: 0, amountPaid: 50 }))).toBe('Paid');
    expect(statusOf(charge())).toBe('Open');
    expect(statusOf(charge({ isPastDue: true }))).toBe('Past Due');
  });

  it('an older API without statusName/isFeeWaived keeps today\'s behaviour', () => {
    const legacy = charge({ amountDue: 0 });
    delete legacy.statusName;
    delete legacy.isFeeWaived;
    expect(statusOf(legacy)).toBe('Paid');
  });
});

// ── C8: therapist statement ──────────────────────────────────────────────────

describe('C8 — therapist statement labels', () => {
  it('status, tooltip and time use friendly labels', () => {
    const wrapper = mount(TherapistStatementScreen, { props: { statement: therapistStatement([tSession()]) } });
    expect(wrapper.find('[data-testid="therapist-stmt-status"]').text()).toBe('No Show');
    expect(wrapper.find('[data-testid="therapist-stmt-provider"]').attributes('title')).toBe('Non-billable: No Show');
    expect(wrapper.find('[data-testid="therapist-stmt-time"]').text()).toBe('1:30 PM');
  });

  it('the pro-forma note no longer claims Service Payments are untracked', () => {
    const wrapper = mount(TherapistStatementScreen, { props: { statement: therapistStatement([tSession()]) } });
    const note = wrapper.find('[data-testid="therapist-stmt-proforma"]').text();
    expect(note).not.toContain('not yet tracked');
    expect(note).toContain('Estimated');
  });
});
