// utils/linePrice.ts
//
// WP-61: the ONE client-side mirror of the API's price resolution (WP-39): the specialty's
// current-effective duration row → else its defaultAmount → else none. Used by the booking form
// (WP-40 preview), the treatment-plan form (no-price guard) and the scheduling wizard (step-2
// estimate). UX only — the API re-resolves authoritatively at each session's date.

import type { LookupItem } from '../interfaces/Lookups';

export type PriceSource = 'durationPrice' | 'defaultAmount' | 'none';

export interface LinePrice {
  amount: number | null;
  source: PriceSource;
}

export function resolveLinePrice(specialty: LookupItem | null | undefined, durationMinutes: number): LinePrice {
  if (!specialty) return { amount: null, source: 'none' };
  const row = (specialty.durationPrices ?? []).find(p => p.durationMinutes === durationMinutes);
  if (row) return { amount: row.amount, source: 'durationPrice' };
  if (specialty.defaultAmount != null) return { amount: specialty.defaultAmount, source: 'defaultAmount' };
  return { amount: null, source: 'none' };
}

/** WP-61 owner ruling: the toast text when a plan line has no price (names specialty + duration). */
export function missingPlanPriceMessage(specialtyName: string, durationMinutes: number): string {
  return `No price for ${specialtyName} at ${durationMinutes} min — add one in Admin › Specialty prices before continuing.`;
}
