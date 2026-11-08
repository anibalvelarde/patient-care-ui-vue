// WP-56C — session durations (minutes).
//
// BOOKABLE vs PRICED are different concepts that currently hold the same values — keep them as two
// lists (WP-56 plan §A). Bookable mirrors the API's booking validation; priced is the WP-39
// price-sheet grid. Both mirror the API's `SpecialtyPricing.AllowedDurations` today. 40 was removed
// by WP-55 G5 (hotfixed in UI PR #98). Lockstep-guarded.

export const BOOKABLE_DURATIONS = [30, 45, 60, 90, 120] as const;
export type BookableDuration = (typeof BOOKABLE_DURATIONS)[number];

export const PRICED_DURATIONS = [30, 45, 60, 90, 120] as const;
export type PricedDuration = (typeof PRICED_DURATIONS)[number];
