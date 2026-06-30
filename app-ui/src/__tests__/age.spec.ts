// WP-18C — derived patient age helper.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { formatAge } from '../utils/age';

describe('formatAge', () => {
  beforeAll(() => {
    // Freeze "now" so age math is deterministic.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-29T12:00:00'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('computes whole years and months', () => {
    expect(formatAge('2000-01-15')).toBe('26 yrs 5 mos');
  });

  it('borrows a month when the birthday day-of-month is later this month', () => {
    // DoB day (30) is after "today" (29) → June not yet completed.
    expect(formatAge('2020-05-30')).toBe('6 yrs 0 mos');
  });

  it('handles an exact birthday (0 months)', () => {
    expect(formatAge('2010-06-29')).toBe('16 yrs 0 mos');
  });

  it('accepts full ISO datetime strings (API shape)', () => {
    expect(formatAge('2000-01-15T00:00:00')).toBe('26 yrs 5 mos');
  });

  it('returns empty string for blank / null / undefined', () => {
    expect(formatAge('')).toBe('');
    expect(formatAge(null)).toBe('');
    expect(formatAge(undefined)).toBe('');
  });

  it('returns empty string for invalid or future dates', () => {
    expect(formatAge('not-a-date')).toBe('');
    expect(formatAge('2099-01-01')).toBe('');
  });
});
