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
export interface PatientSessionHistorySummary {
  patientId: number;
  patientName: string;
  medicalRecordNumber: string | null;
  lastSessionDate: string | null;
  totalSessions: number;
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
}
