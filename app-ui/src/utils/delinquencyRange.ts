// Oldest/newest session dates for a delinquency row.
//
// Scope decision (owner, 2026-07-05): the range covers PAST-DUE sessions only,
// matching the "Past-Due Sessions" count column — a row's drill-down may also
// list newer unpaid sessions that haven't crossed the 35-day rule yet, and
// those must not stretch the range.
//
// sessionDate is the API's date-only string (yyyy-MM-dd), so lexicographic
// comparison IS chronological comparison — no Date parsing (and no timezone
// pitfalls) needed here.
import type { DelinquentSession } from '../interfaces/Delinquency';

export interface SessionDateRange {
  oldest: string | null;
  newest: string | null;
}

export function pastDueDateRange(sessions: DelinquentSession[]): SessionDateRange {
  let oldest: string | null = null;
  let newest: string | null = null;
  for (const s of sessions) {
    if (!s.isPastDue || !s.sessionDate) continue;
    if (oldest === null || s.sessionDate < oldest) oldest = s.sessionDate;
    if (newest === null || s.sessionDate > newest) newest = s.sessionDate;
  }
  return { oldest, newest };
}
