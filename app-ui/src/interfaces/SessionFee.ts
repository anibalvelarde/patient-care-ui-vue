// interfaces/SessionFee.ts
// WP-49 (BR3/BR4): late chargeback batch + fee waiver.
// Contract: ../../../patient-care-super/_contracts/sessions-api.md § "WP-49 fee policy".

/** One session the late-fee batch would charge. */
export interface LateFeePreviewItem {
  sessionId: number;
  sessionDate: string;
  /** Whole days between the session date and asOf, in the clinic's calendar. */
  daysUnpaid: number;
  patientId: number;
  patientName: string;
  /** null when the patient has no caretaker linked. */
  caretakerName: string | null;
  /** The BR3 base: amount − discount − amountPaid + on-site charge. Excludes any late fee. */
  unpaidBalance: number;
  /** 30% of unpaidBalance, rounded half away from zero. */
  proposedFee: number;
}

export interface LateFeePreviewResult {
  asOf: string;
  ratePct: number;
  graceDays: number;
  items: LateFeePreviewItem[];
  sessionCount: number;
  totalUnpaidBalance: number;
  totalProposedFee: number;
}

export interface ApplyLateFeesRequest {
  /** Explicit — the manager charges the rows they reviewed, not "whatever is eligible now". */
  sessionIds: number[];
  asOf?: string | null;
}

export interface LateFeeAppliedItem {
  sessionId: number;
  feeApplied: number;
  unpaidBalanceBefore: number;
  amountDueAfter: number;
}

/**
 * A session the batch declined to charge, with the reason. Skips are surfaced rather than
 * silently dropped: selecting 12 sessions and getting 9 charged needs an explanation, and
 * "settled between preview and apply" is a normal one.
 */
export interface LateFeeSkippedItem {
  sessionId: number;
  reason: string;
}

export interface ApplyLateFeesResult {
  asOf: string;
  applied: LateFeeAppliedItem[];
  skipped: LateFeeSkippedItem[];
  appliedCount: number;
  skippedCount: number;
  totalFeeApplied: number;
}

/**
 * Which fee a waiver targets. Required with no default — a session can carry BOTH a no-show
 * fee and a late fee, so "waive the fee" is ambiguous.
 */
export type SessionFeeKind = 'Late' | 'NoShow' | 'Both';

export interface WaiveFeeRequest {
  feeKind: SessionFeeKind;
  /** Mandatory. Sanitized server-side; capped at 200 characters to match this form. */
  reason: string;
}

export interface WaiveFeeResult {
  sessionId: number;
  feeKind: SessionFeeKind;
  lateFeeWaived: number;
  noShowFeeWaived: number;
  amountDueAfter: number;
  grossProfitAfter: number;
  waivedOn: string;
  waivedByUserId: number;
}
