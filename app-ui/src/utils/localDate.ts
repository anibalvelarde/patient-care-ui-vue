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

// ── WP-60: the clinic's calendar ─────────────────────────────────────────────

/** The clinic's time zone. Panama is UTC-5 all year (no DST). */
export const CLINIC_TIME_ZONE = 'America/Panama';

/**
 * WP-60 (F-19): "today" as the CLINIC's calendar day, `yyyy-MM-dd`.
 *
 * `new Date().toISOString()` is the UTC date, so from 7 PM Panama time it is already tomorrow —
 * Appointments opened on the next day and Record Payment dated money a day late. This reads the
 * date in America/Panama explicitly, so it's right whatever zone the device clock is set to.
 */
export function clinicToday(now: Date = new Date()): string {
  // en-CA formats as yyyy-MM-dd.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

/** WP-60: calendar arithmetic on `yyyy-MM-dd` (no UTC round-trip, so no day shifts). */
export function addDaysYmd(ymd: string, days: number): string {
  const d = parseWireDate(ymd);
  d.setDate(d.getDate() + days);
  return toLocalYmd(d);
}

/**
 * WP-60 (Q-3, owner ruling): the Monday of the Mon–Sat schedule week a date belongs to. A SUNDAY
 * belongs to the COMING week (the next day). Matches the API's ScheduleMatrixService.GetMonday.
 */
export function mondayOf(ymd: string): string {
  const dow = parseWireDate(ymd).getDay(); // 0 = Sunday
  return dow === 0 ? addDaysYmd(ymd, 1) : addDaysYmd(ymd, -(dow - 1));
}

/**
 * WP-60 (F-9): display a DATE-ONLY value (session/discovery date, DOB, payment date, …).
 * Only the `yyyy-MM-dd` part is used, so neither `"2026-11-08"` (which `new Date` reads as UTC
 * midnight → Nov 7 in Panama) nor a `…T00:00:00Z` form can show the previous day.
 */
export function formatDateOnly(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' },
): string {
  if (!value) return '—';
  const ymd = value.slice(0, 10);
  return DATE_ONLY.test(ymd) ? formatWireDate(ymd, options) : value;
}
