import { describe, expect, it } from 'vitest';
import { pastDueDateRange, pastDueReceivable } from '../utils/delinquencyRange';
import type { DelinquentPatient, DelinquentSession } from '../interfaces/Delinquency';

function session(overrides: Partial<DelinquentSession>): DelinquentSession {
  return {
    sessionId: 1,
    sessionDate: '2026-01-01',
    sessionTime: '00:00:00',
    patient: 'P',
    therapist: 'T',
    therapyTypes: 'TC',
    amount: 50,
    discount: 0,
    amountPaid: 0,
    amountDue: 50,
    isPastDue: true,
    isPaidOff: false,
    notes: '',
    patientId: 1,
    therapistId: 1,
    ...overrides,
  };
}

describe('pastDueDateRange', () => {
  it('returns min and max sessionDate across past-due sessions', () => {
    const r = pastDueDateRange([
      session({ sessionId: 1, sessionDate: '2026-03-15' }),
      session({ sessionId: 2, sessionDate: '2026-01-04' }),
      session({ sessionId: 3, sessionDate: '2026-05-20' }),
    ]);
    expect(r).toEqual({ oldest: '2026-01-04', newest: '2026-05-20' });
  });

  it('ignores sessions that are not past due (35-day rule not yet crossed)', () => {
    const r = pastDueDateRange([
      session({ sessionId: 1, sessionDate: '2026-02-10' }),
      session({ sessionId: 2, sessionDate: '2025-11-30', isPastDue: false }), // older but not past due
      session({ sessionId: 3, sessionDate: '2026-06-28', isPastDue: false }), // newer but not past due
    ]);
    expect(r).toEqual({ oldest: '2026-02-10', newest: '2026-02-10' });
  });

  it('collapses to a single date when only one past-due session exists', () => {
    const r = pastDueDateRange([session({ sessionDate: '2026-04-01' })]);
    expect(r).toEqual({ oldest: '2026-04-01', newest: '2026-04-01' });
  });

  it('returns nulls when no session is past due or the list is empty', () => {
    expect(pastDueDateRange([])).toEqual({ oldest: null, newest: null });
    expect(pastDueDateRange([session({ isPastDue: false })]))
      .toEqual({ oldest: null, newest: null });
  });

  it('skips past-due sessions with a blank date instead of treating them as oldest', () => {
    const r = pastDueDateRange([
      session({ sessionId: 1, sessionDate: '' }),
      session({ sessionId: 2, sessionDate: '2026-02-14' }),
    ]);
    expect(r).toEqual({ oldest: '2026-02-14', newest: '2026-02-14' });
  });

  it('orders correctly across year boundaries (plain string comparison)', () => {
    const r = pastDueDateRange([
      session({ sessionId: 1, sessionDate: '2026-01-02' }),
      session({ sessionId: 2, sessionDate: '2025-12-28' }),
    ]);
    expect(r).toEqual({ oldest: '2025-12-28', newest: '2026-01-02' });
  });
});

function patient(pastDueTotalAmount: number, amountPaidSoFar: number): DelinquentPatient {
  return {
    partyType: 'Patient',
    party: { id: 1, name: 'P', isValid: true },
    pastDueSessions: 1,
    pastDueTotalAmount,
    amountPaidSoFar,
    delinquency: [],
  };
}

describe('pastDueReceivable', () => {
  it('sums Balance (past-due total minus paid-so-far) across all patients', () => {
    // mirrors the Delinquent tab's Balance column so the dashboard tile matches the tab
    expect(pastDueReceivable([patient(300, 60), patient(75, 0)])).toBe(315);
  });

  it('returns 0 for an empty list', () => {
    expect(pastDueReceivable([])).toBe(0);
  });

  it('keeps partial payments and cent amounts exact per row', () => {
    expect(pastDueReceivable([patient(100.5, 25.25), patient(50, 50)])).toBeCloseTo(75.25, 2);
  });
});
