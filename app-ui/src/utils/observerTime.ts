// utils/observerTime.ts — WP-54C
//
// The change log shows times in the OBSERVER's timezone (owner ruling G5), NOT a fixed clinic tz.
// The DB stores UTC; this module computes preset/custom day boundaries in the viewer's local time
// and reports the offset to send as `tzOffsetMinutes`, so the server buckets to the viewer's
// calendar. (Deliberately does not assume Panama — that is the whole point of G5.)

export type RangePreset = 'today' | 'yesterday' | 'last7' | 'last30' | 'custom';

export interface UtcRange {
  fromUtc: string; // inclusive
  toUtc: string;   // exclusive
}

/** Minutes to ADD to a UTC instant to get observer-local time (Panama UTC-5 → -300). */
export function observerOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

/** The observer's IANA timezone name (e.g. "America/Panama"), for captions/footers. */
export function observerTimeZoneName(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local time';
  } catch {
    return 'local time';
  }
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

/** Boundaries for a named preset, in the viewer's local calendar, returned as UTC instants. */
export function presetBounds(preset: Exclude<RangePreset, 'custom'>, now: Date = new Date()): UtcRange {
  const startToday = startOfLocalDay(now);
  switch (preset) {
    case 'yesterday':
      return { fromUtc: addDays(startToday, -1).toISOString(), toUtc: startToday.toISOString() };
    case 'last7':
      return { fromUtc: addDays(startToday, -6).toISOString(), toUtc: now.toISOString() };
    case 'last30':
      return { fromUtc: addDays(startToday, -29).toISOString(), toUtc: now.toISOString() };
    case 'today':
    default:
      return { fromUtc: startToday.toISOString(), toUtc: now.toISOString() };
  }
}

/**
 * Boundaries for a custom range from two `yyyy-MM-dd` inputs (inclusive of both dates), in local
 * time → UTC. Returns null if either input is missing/invalid.
 */
export function customBounds(fromDate: string, toDate: string): UtcRange | null {
  const from = parseLocalDate(fromDate);
  const to = parseLocalDate(toDate);
  if (!from || !to) {
    return null;
  }
  return { fromUtc: from.toISOString(), toUtc: addDays(to, 1).toISOString() }; // to-date inclusive
}

function parseLocalDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!m) {
    return null;
  }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Format a UTC ISO instant for display in the observer's timezone. */
export function formatObserverDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export function formatObserverTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatObserverDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
