// WP-37 (SEN-1): SENADIS discount-expiration helpers, shared by PatientFormModal,
// BookingFormModal, and SchedulePlanWizard so the G2/G3 semantics can't drift between them:
//   G2 — the discount is expired for a given booking when expiration < the SESSION date
//        (comparison is against the session date being booked, not "today").
//   G3 — an expired SENADIS keeps hasSenadisDiscount = true (history is never auto-cleared);
//        the UI shows a "SENADIS expired {date}" badge instead of applying the floor.
// The API applies the same predicate server-side (Patient.HasActiveSenadisDiscount) — these
// helpers only keep the modal hints/clamps honest before submit.

/** Date-only `yyyy-MM-dd` from an API datetime (`2027-06-30T00:00:00`) or a date-input value. */
export function toDateOnly(value: string): string {
  return value.slice(0, 10);
}

/** Local today as `yyyy-MM-dd` (no UTC shift — toISOString would skew evening timezones). */
export function todayDateOnly(): string {
  const d = new Date();
  return `${String(d.getFullYear()).padStart(4, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * G2: expired when `expiration < onDate`, date-only. The boundary (onDate == expiration) is
 * NOT expired — a session booked for the expiry day itself still gets the floor. Null/absent
 * expiry = open-ended (G1), never expires; a blank onDate compares as not-expired (fail open —
 * the API floors server-side regardless).
 */
export function isSenadisExpired(expiration: string | null | undefined, onDate: string): boolean {
  if (!expiration || !onDate) return false;
  // ISO yyyy-MM-dd strings compare correctly as plain strings — no Date parsing, no timezone.
  return toDateOnly(expiration) < toDateOnly(onDate);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Badge text date — deterministic, locale-independent (e.g. `Jun 30, 2026`). */
export function formatSenadisExpiry(expiration: string | null | undefined): string {
  if (!expiration) return '';
  const [y, m, d] = toDateOnly(expiration).split('-').map(Number);
  if (!y || !m || !d) return toDateOnly(expiration);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}
