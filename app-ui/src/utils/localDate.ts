// Browser-local calendar day as yyyy-MM-dd.
//
// Unlike `Date.prototype.toISOString()` (which is UTC and, for users west of UTC, can roll to the next
// calendar day late in the evening), this returns the date in the user's OWN timezone. That's what the
// payroll flows need: PaymentDate / from / to are date-only *business dates*, so they must reflect the
// user's local "today", not a UTC instant.
export function toLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
