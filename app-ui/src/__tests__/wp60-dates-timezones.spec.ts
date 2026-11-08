// WP-60 (E2E findings F-9, F-19, Q-3) — dates and time zones.
//   F-19: after 7 PM Panama the app said "tomorrow": `new Date().toISOString()` is the UTC date.
//         "today" now comes from clinicToday() (America/Panama, whatever the device zone is).
//   F-9:  a date-only wire value "2026-11-08" parsed with `new Date(x)` is UTC midnight and showed as
//         Nov 7 in Panama. Date-only values now display through formatDateOnly().
//   Q-3:  the schedule grid is Mon–Sat; a Sunday belongs to the COMING week (owner ruling).
// vitest runs with TZ=America/Panama (vitest.config.ts) so "a day early" bugs fail here, not in prod.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { clinicToday, addDaysYmd, mondayOf, formatDateOnly } from '../utils/localDate';
import { formatObserverTime } from '../utils/observerTime';

afterEach(() => vi.useRealTimers());

describe('clinicToday — WP-60 F-19', () => {
  it.each([
    ['2026-11-09T01:30:00Z', '2026-11-08'], // 8:30 PM Nov 8 in Panama — NOT tomorrow
    ['2026-11-09T04:59:00Z', '2026-11-08'], // 11:59 PM Panama
    ['2026-11-09T05:00:00Z', '2026-11-09'], // midnight Panama
    ['2026-11-08T14:00:00Z', '2026-11-08'],
  ])('at %s the clinic day is %s', (utc, expected) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(utc));
    expect(clinicToday()).toBe(expected);
  });

  it('runs the suite in Panama time (guards the TZ setting itself)', () => {
    expect(new Date('2026-11-08T12:00:00Z').getTimezoneOffset()).toBe(300);
  });
});

describe('addDaysYmd / mondayOf — WP-60 Q-3', () => {
  it('adds days across month ends without a UTC round-trip', () => {
    expect(addDaysYmd('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDaysYmd('2026-11-09', -7)).toBe('2026-11-02');
  });

  it.each([
    ['2026-11-08', '2026-11-09'], // Sunday → the coming Monday
    ['2026-11-09', '2026-11-09'], // Monday
    ['2026-11-14', '2026-11-09'], // Saturday → that week's Monday
  ])('mondayOf(%s) = %s', (d, m) => expect(mondayOf(d)).toBe(m));
});

describe('formatDateOnly — WP-60 F-9', () => {
  it.each([
    ['2026-11-08', 'Nov 8, 2026'],               // DateOnly on the wire
    ['2026-11-08T00:00:00', 'Nov 8, 2026'],      // DateTime without Z (DOB, paymentDate today)
    ['2026-11-08T00:00:00Z', 'Nov 8, 2026'],     // …and if a Z ever appears, still the same day
  ])('%s → %s', (wire, shown) => expect(formatDateOnly(wire)).toBe(shown));

  it('empty → em dash', () => expect(formatDateOnly(null)).toBe('—'));
});

describe('no UTC "today" or UTC date-only parsing left in src — WP-60 guard', () => {
  const sources = import.meta.glob('../**/*.{vue,ts}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
  const files = Object.entries(sources).filter(([p]) => !p.includes('__tests__'));

  it('no toISOString() used as a calendar date', () => {
    const offenders = files
      .filter(([, src]) => /toISOString\(\)\s*\.(split\('T'\)\[0\]|slice\(0,\s*10\))/.test(src))
      .map(([p]) => p);
    expect(offenders).toEqual([]);
  });
});

// WP-60 (F-15): the WP-54 specs used fixtures WITH 'Z', so they passed while the real API sent
// none and every change-log time showed 5 h late. Pin the REAL wire shape the API now sends.
describe('change-log times — WP-60 F-15 real wire shape', () => {
  it("the API's UTC instant (with Z, as WP-60B sends it) shows the Panama wall-clock time", () => {
    // A change made at 1:48 PM Panama = 18:48 UTC.
    expect(formatObserverTime('2026-11-08T18:48:01.787358Z')).toMatch(/^1:48\s?PM$/);
  });

  it('documents the bug: the same instant WITHOUT Z is read as local time (6:48 PM, 5 h off)', () => {
    expect(formatObserverTime('2026-11-08T18:48:01.787358')).toMatch(/^6:48\s?PM$/);
  });
});
