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

// Parse a wire date for DISPLAY, without the UTC round-trip that shifts the day.
//
// `new Date('2026-05-16')` is specified to parse the date-only form as UTC midnight. Rendered
// in any timezone west of UTC — Panama is UTC-5 — that instant is still the PREVIOUS day, so a
// session dated the 16th displayed as "May 15" on statements. The API is not at fault: it sends
// a plain `yyyy-MM-dd` string, and the clock service is uninvolved.
//
// Date-only strings are therefore constructed field-by-field, which the spec parses as LOCAL
// midnight. Anything else (a full ISO timestamp, e.g. a payment's `paymentDate`) is a real
// instant and is left to the normal parser.
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseWireDate(value: string): Date {
  const m = DATE_ONLY.exec(value);
  if (!m) return new Date(value);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/// Display helper: "May 16, 2026". Empty input renders as an em dash.
export function formatWireDate(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' },
): string {
  if (!value) return '—';
  const d = parseWireDate(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-US', options);
}
