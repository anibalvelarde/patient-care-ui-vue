import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia, type Pinia } from 'pinia';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import type { Appointment } from '../interfaces/Appointment';
import type { LateFeePreviewResult, LateFeePreviewItem, ApplyLateFeesResult } from '../interfaces/SessionFee';
import { sanitizePrintNotes } from '../utils/sanitizePrintNotes';
import ApplyLateFeesWizard from '../components/payments/ApplyLateFeesWizard.vue';
import WaiveFeeModal from '../components/appointments/WaiveFeeModal.vue';

// ── mocks ────────────────────────────────────────────────────────────────────────────────

const { previewLateFeesMock, applyLateFeesMock, waiveFeeMock } = vi.hoisted(() => ({
  previewLateFeesMock: vi.fn(),
  applyLateFeesMock: vi.fn(),
  waiveFeeMock: vi.fn(),
}));

vi.mock('../services/SessionsHttpClient', () => ({
  SessionsHttpClient: vi.fn().mockImplementation(() => ({
    previewLateFees: previewLateFeesMock,
    applyLateFees: applyLateFeesMock,
    waiveFee: waiveFeeMock,
  })),
}));

// ── auth ─────────────────────────────────────────────────────────────────────────────────

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
    userId: 3, email: 'test@example.com', fullName: 'Test User',
    mustChangePassword: false, roles: [role], claims: claimsForRole(role),
    isSystemAdmin: false,
  };
  return pinia;
}

// ── factories ────────────────────────────────────────────────────────────────────────────

function previewItem(overrides: Partial<LateFeePreviewItem> = {}): LateFeePreviewItem {
  return {
    sessionId: 11995,
    sessionDate: '2026-05-20',
    daysUnpaid: 80,
    patientId: 1,
    patientName: 'Juliana Duarte',
    caretakerName: 'Ana Duarte',
    unpaidBalance: 125,
    proposedFee: 37.5,
    ...overrides,
  };
}

function preview(items: LateFeePreviewItem[] = [previewItem()]): LateFeePreviewResult {
  return {
    asOf: '2026-08-08',
    ratePct: 30,
    graceDays: 6,
    items,
    sessionCount: items.length,
    totalUnpaidBalance: items.reduce((s, i) => s + i.unpaidBalance, 0),
    totalProposedFee: items.reduce((s, i) => s + i.proposedFee, 0),
  };
}

function applyResult(overrides: Partial<ApplyLateFeesResult> = {}): ApplyLateFeesResult {
  return {
    asOf: '2026-08-08',
    applied: [{ sessionId: 11995, feeApplied: 37.5, unpaidBalanceBefore: 125, amountDueAfter: 162.5 }],
    skipped: [],
    appliedCount: 1,
    skippedCount: 0,
    totalFeeApplied: 37.5,
    ...overrides,
  };
}

function appointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    sessionId: 11995, sessionDate: '2026-05-20', sessionTime: '10:00:00',
    patient: 'Juliana Duarte', therapist: 'Dra. Silvia', therapyTypes: 'PSICOT',
    amount: 125, discount: 0, amountPaid: 0, amountDue: 162.5,
    isPastDue: true, isPaidOff: false, notes: '', patientId: 1, therapistId: 1,
    time: '10:00:00', appointmentStatusId: 4, statusName: 'Completed', isConfirmed: true,
    siteId: 1, siteName: 'Main', specialtyTypeId: 17, specialtyAbbreviation: 'PSICOT',
    specialtyName: 'Psicoterapia', isDiscovery: false,
    caretakerName: 'Ana Duarte', caretakerPhone: null, caretakerEmail: null,
    lateFeeAmount: 37.5, lateFeeAppliedOn: '2026-08-08', feeWaivedOn: null, carriesFee: true,
    ...overrides,
  } as Appointment;
}

// ── the batch wizard ─────────────────────────────────────────────────────────────────────

describe('WP-49 — Apply Late Fees wizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    previewLateFeesMock.mockResolvedValue(preview());
    applyLateFeesMock.mockResolvedValue(applyResult());
  });

  const openWizard = (role = 'MGR') =>
    mount(ApplyLateFeesWizard, { global: { plugins: [authAs(role)] } });

  it('names both clocks up front, because "past due" already means the 35-day rule', () => {
    const banner = openWizard().find('[data-testid="late-fees-banner"]').text();
    expect(banner).toContain('7+ days');
    expect(banner).toContain('separate from the 35-day past-due rule');
  });

  it('previews eligible sessions with the balance and the proposed fee', async () => {
    const w = openWizard();
    await w.find('[data-testid="late-fees-preview-btn"]').trigger('click');
    await flushPromises();

    expect(w.findAll('[data-testid="late-fees-row"]')).toHaveLength(1);
    const row = w.find('[data-testid="late-fees-row"]').text();
    expect(row).toContain('Juliana Duarte');
    expect(row).toContain('Ana Duarte');
    expect(row).toContain('$125.00');
    expect(row).toContain('$37.50');
    expect(w.find('[data-testid="late-fees-total"]').text()).toContain('$37.50');
  });

  it('previewing charges nothing', async () => {
    const w = openWizard();
    await w.find('[data-testid="late-fees-preview-btn"]').trigger('click');
    await flushPromises();
    expect(applyLateFeesMock).not.toHaveBeenCalled();
  });

  it('charges only the sessions left selected', async () => {
    previewLateFeesMock.mockResolvedValue(preview([
      previewItem({ sessionId: 1 }),
      previewItem({ sessionId: 2 }),
    ]));
    const w = openWizard();
    await w.find('[data-testid="late-fees-preview-btn"]').trigger('click');
    await flushPromises();

    // Deselect the first row — it must not be charged.
    await w.findAll('[data-testid="late-fees-row-checkbox"]')[0].setValue(false);
    expect(w.find('[data-testid="late-fees-selected-count"]').text()).toContain('1 session selected');

    await w.find('[data-testid="late-fees-apply-btn"]').trigger('click');
    await flushPromises();

    expect(applyLateFeesMock).toHaveBeenCalledWith(expect.objectContaining({ sessionIds: [2] }));
  });

  it('reports skipped sessions WITH the reason, not just a smaller total', async () => {
    // The manager selected rows and got fewer charged — "settled in between" is a normal
    // answer, but it has to be visible or the run looks like it silently lost work.
    applyLateFeesMock.mockResolvedValue(applyResult({
      applied: [],
      appliedCount: 0,
      totalFeeApplied: 0,
      skipped: [{ sessionId: 11995, reason: 'Session has no unpaid balance — it was settled before the fee was applied.' }],
      skippedCount: 1,
    }));

    const w = openWizard();
    await w.find('[data-testid="late-fees-preview-btn"]').trigger('click');
    await flushPromises();
    await w.find('[data-testid="late-fees-apply-btn"]').trigger('click');
    await flushPromises();

    const skipped = w.find('[data-testid="late-fees-skipped"]');
    expect(skipped.exists()).toBe(true);
    expect(skipped.text()).toContain('#11995');
    expect(skipped.text()).toContain('no unpaid balance');
  });

  it('shows a purposeful empty state rather than a bare table', async () => {
    previewLateFeesMock.mockResolvedValue(preview([]));
    const w = openWizard();
    await w.find('[data-testid="late-fees-preview-btn"]').trigger('click');
    await flushPromises();

    expect(w.find('[data-testid="late-fees-empty"]').text()).toContain('No sessions are eligible');
  });

  it('surfaces an API failure instead of failing silently', async () => {
    previewLateFeesMock.mockRejectedValue(new Error('boom'));
    const w = openWizard();
    await w.find('[data-testid="late-fees-preview-btn"]').trigger('click');
    await flushPromises();

    expect(w.find('[data-testid="late-fees-error"]').text()).toContain('boom');
  });

  // ── claim gating ──

  it('AM can preview but the Apply button is DISABLED with a reason, not hidden', async () => {
    const w = openWizard('AM');
    await w.find('[data-testid="late-fees-preview-btn"]').trigger('click');
    await flushPromises();

    const applyBtn = w.find('[data-testid="late-fees-apply-btn"]');
    expect(applyBtn.exists()).toBe(true);                                  // present…
    expect(applyBtn.attributes('disabled')).toBeDefined();                 // …but not usable
    expect(w.find('[data-testid="late-fees-no-claim-note"]').text()).toContain('manager action');
  });

  it('AM clicking Apply cannot charge anything', async () => {
    const w = openWizard('AM');
    await w.find('[data-testid="late-fees-preview-btn"]').trigger('click');
    await flushPromises();
    await w.find('[data-testid="late-fees-apply-btn"]').trigger('click');
    await flushPromises();

    expect(applyLateFeesMock).not.toHaveBeenCalled();
  });

  it('MGR can apply', async () => {
    const w = openWizard('MGR');
    await w.find('[data-testid="late-fees-preview-btn"]').trigger('click');
    await flushPromises();

    expect(w.find('[data-testid="late-fees-apply-btn"]').attributes('disabled')).toBeUndefined();
  });
});

// ── the waive modal ──────────────────────────────────────────────────────────────────────

describe('WP-49 — Waive Fee modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    waiveFeeMock.mockResolvedValue({
      sessionId: 11995, feeKind: 'Late', lateFeeWaived: 37.5, noShowFeeWaived: 0,
      amountDueAfter: 125, grossProfitAfter: 125, waivedOn: '2026-08-08', waivedByUserId: 3,
    });
  });

  const openModal = async (appt: Appointment) => {
    const w = mount(WaiveFeeModal, {
      props: { visible: false, appointment: appt },
      global: { plugins: [authAs('MGR')], stubs: { teleport: true } },
    });
    await w.setProps({ visible: true });
    await flushPromises();
    return w;
  };

  it('preselects the only available kind and shows the money change', async () => {
    const w = await openModal(appointment());

    expect((w.find('[data-testid="waive-fee-kind-late"]').element as HTMLInputElement).checked).toBe(true);
    // No-show is not offered — there is no marker on this session.
    expect(w.find('[data-testid="waive-fee-kind-noshow"]').attributes('disabled')).toBeDefined();
    expect(w.find('[data-testid="waive-fee-after"]').text()).toContain('$125.00');
  });

  it('requires a reason before it will submit', async () => {
    const w = await openModal(appointment());

    expect(w.find('[data-testid="waive-fee-submit"]').attributes('disabled')).toBeDefined();

    await w.find('[data-testid="waive-fee-reason"]').setValue('caretaker hospitalized');
    expect(w.find('[data-testid="waive-fee-submit"]').attributes('disabled')).toBeUndefined();
  });

  it('sends the kind and the trimmed reason', async () => {
    const w = await openModal(appointment());
    await w.find('[data-testid="waive-fee-reason"]').setValue('  caretaker hospitalized  ');
    await w.find('form').trigger('submit');
    await vi.waitFor(() => expect(waiveFeeMock).toHaveBeenCalled());

    expect(waiveFeeMock).toHaveBeenCalledWith(11995, {
      feeKind: 'Late',
      reason: 'caretaker hospitalized',
    });
  });

  it('does NOT offer a late fee that was already waived', async () => {
    // 0.00 with the latch still set = applied then forgiven. Nothing left to waive.
    const w = await openModal(appointment({ lateFeeAmount: 0, feeWaivedOn: '2026-08-01', amountDue: 125 }));

    expect(w.find('[data-testid="waive-fee-kind-late"]').attributes('disabled')).toBeDefined();
  });

  it('offers BOTH only when the session actually carries both fees', async () => {
    const withBoth = appointment({
      amount: 85, discount: 0, lateFeeAmount: 25.5, amountDue: 110.5,
      notes: '[NOSHOW-FEE 2026-07-01: was A:85.00]',
      appointmentStatusId: 5, statusName: 'NoShow',
    });
    const w = await openModal(withBoth);

    expect(w.find('[data-testid="waive-fee-kind-both"]').attributes('disabled')).toBeUndefined();
    // With two options the manager must choose — nothing is preselected.
    expect((w.find('[data-testid="waive-fee-kind-late"]').element as HTMLInputElement).checked).toBe(false);

    await w.find('[data-testid="waive-fee-kind-both"]').setValue();
    await w.find('[data-testid="waive-fee-reason"]').setValue('billed in error');
    expect(w.find('[data-testid="waive-fee-after"]').text()).toContain('$0.00');
  });

  it('renders the API 400 verbatim — the credit guard message must reach the operator', async () => {
    waiveFeeMock.mockRejectedValue(new Error(
      'Waiving this fee would leave the caretaker with a credit — record a refund instead.'));

    const w = await openModal(appointment());
    await w.find('[data-testid="waive-fee-reason"]').setValue('overpaid');
    await w.find('form').trigger('submit');
    await flushPromises();

    expect(w.find('[data-testid="waive-fee-error"]').text()).toContain('would leave the caretaker with a credit');
  });
});

// ── Finding 2: the print sanitizer ───────────────────────────────────────────────────────

describe('WP-49 (Finding 2) — print sanitizer covers the money markers', () => {
  // The old pattern required a colon IMMEDIATELY after the marker name, so NONE of these
  // matched — three live sessions were printing [CANCELLED-ZEROED …] to caretakers.
  const MONEY_MARKERS = [
    '[CANCELLED-ZEROED 2026-07-28: was A:100.00 D:0.00 P:50.00 G:50.00]',
    '[NOSHOW-FEE 2026-07-28: was A:85.00 D:0.00 P:40.00 G:45.00]',
    '[LATE-FEE 2026-08-08: 30% of 125.00 = 37.50; 80 days unpaid]',
    '[FEE-WAIVED 2026-08-08: late 37.50 waived by u#3; reason: caretaker hospitalized]',
  ];

  it.each(MONEY_MARKERS)('strips %s', (marker) => {
    expect(sanitizePrintNotes(marker)).toBe('');
  });

  it('keeps the therapist content and drops only the markers', () => {
    const notes = `Worked on grip strength.\n${MONEY_MARKERS[2]}\n${MONEY_MARKERS[3]}`;
    expect(sanitizePrintNotes(notes)).toBe('Worked on grip strength.');
  });

  it('a waiver REASON never reaches caretaker-facing print', () => {
    // The reason is free text a manager typed for internal audit — it is not for the family.
    expect(sanitizePrintNotes(
      'Session went well. [FEE-WAIVED 2026-08-08: late 37.50 waived by u#3; reason: family had a bereavement]'
    )).toBe('Session went well.');
  });

  it('still leaves legitimate therapist brackets alone', () => {
    expect(sanitizePrintNotes('Bring [orthotic] insert. [follow up next week]'))
      .toBe('Bring [orthotic] insert. [follow up next week]');
  });

  it('does not swallow free text that merely starts with a marker word', () => {
    // Why the separator is "colon OR space+date+colon" rather than a loose "[: ]" class:
    // the looser version would erase this line from a caretaker's report.
    expect(sanitizePrintNotes('[LEGACY-IMPORT note without colon]'))
      .toBe('[LEGACY-IMPORT note without colon]');
    expect(sanitizePrintNotes('[LATE-FEE discussion with mother]'))
      .toBe('[LATE-FEE discussion with mother]');
  });

  it('is not fooled by lower-case near-misses', () => {
    expect(sanitizePrintNotes('[late-fee 2026-08-08: not the mint format]'))
      .toBe('[late-fee 2026-08-08: not the mint format]');
  });
});
