// interfaces/SessionHistory.ts — WP-21 (F1)

// The platform's paged envelope (first introduced by WP-21; mirror for future paged endpoints).
// `page` is 1-based; `totalCount` is the size of the full filtered set.
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

// One row of the Session History tab's patient list — ordered most-recent-session first by the
// API; lastSessionDate null / totalSessions 0 = patient has never had a session (sorts last).
// WP-35 (SH-1): firstSessionDate ("yyyy-MM-dd") is additive and OPTIONAL — an older API during
// rollout won't send it, so consumers must tolerate `undefined` as well as null (zero sessions).
// WP-35 money addendum: grossAmount/discountAmount/grossProfit are lifetime SUMs (any status,
// same population as totalSessions) and ride Appointments.ProviderAmount — callers without the
// claim (FD, ACCT) get the keys OMITTED from the wire entirely (not null, not 0). Optional
// typing is the single tolerance mechanism for both claim-shaping and an older API.
export interface PatientSessionHistorySummary {
  patientId: number;
  patientName: string;
  medicalRecordNumber: string | null;
  firstSessionDate?: string | null;
  lastSessionDate: string | null;
  totalSessions: number;
  grossAmount?: number;
  discountAmount?: number;
  grossProfit?: number;
}

// WP-35 money addendum: aggregate over the FULL filtered set (respects `search`, not just the
// visible page). sessionCount is always present; money keys are claim-shaped away like the
// per-row fields above.
export interface SessionHistoryTotals {
  sessionCount: number;
  grossAmount?: number;
  discountAmount?: number;
  grossProfit?: number;
}

// WP-35 money addendum: derived envelope for GET /api/patients/session-history ONLY — the
// shared PagedResult<T> is unchanged elsewhere. `totals` is optional so an older API (plain
// PagedResult) can't break the page.
export interface SessionHistoryPagedResult extends PagedResult<PatientSessionHistorySummary> {
  totals?: SessionHistoryTotals;
}

// A session row inside an expanded patient (subset of the API's SessionEvent shape —
// see patient-care-super/_contracts/sessions-api.md). providerAmount is deliberately absent:
// the API field-shapes it away for callers without Appointments.ProviderAmount.
export interface PatientHistorySession {
  sessionId: number;
  sessionDate: string;
  sessionTime: string;
  therapist: string;
  therapyTypes: string | null;
  specialtyName: string | null;
  specialtyAbbreviation: string | null;
  amount: number;
  discount: number;
  amountPaid: number;
  amountDue: number;
  isPaidOff: boolean;
  appointmentStatusId: number;
  statusName: string;
  // WP-35 (SH-2): the API has always sent SessionEvent.Notes on this endpoint — the interface
  // simply omitted it. Optional so older fixtures/payloads without it stay valid.
  notes?: string | null;
  // WP-49 (BR3): the late chargeback in force on this session. Optional so an older API and
  // existing fixtures stay valid; null/absent = never applied, 0 = applied then waived.
  // Already included in amountDue — the column EXPLAINS that number rather than adding to it.
  lateFeeAmount?: number | null;
}
