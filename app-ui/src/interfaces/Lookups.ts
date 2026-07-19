// Generic lookup table interfaces (unified API shape)

// WP-39: one current-effective per-duration price on the lookup projection.
// Only durations with a price effective TODAY appear; absent = no effective price
// (booking falls back to defaultAmount — WP-40 consumes this).
export interface DurationPrice {
  durationMinutes: number;
  amount: number;
  effectiveFrom: string; // "yyyy-MM-dd"
}

export interface LookupItem {
  id: number;
  abbreviation: string;
  name: string;
  description: string | null;
  sortOrder: number;
  // WP-23 (F6): per-type field — populated only for specialty-types (default session price
  // pre-filled at booking; null = no default); null on every other table.
  defaultAmount?: number | null;
  // WP-39 (PR-2): specialty-types only — this therapy can be performed on-site; false elsewhere.
  offeredOnSite?: boolean;
  // WP-39 (PR-1): specialty-types only — current-effective price sheet; [] on every other table.
  durationPrices?: DurationPrice[];
  createdTimestamp: string;
  lastUpdatedTimestamp: string;
}

export interface LookupCreateRequest {
  abbreviation: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
  // WP-23 (F6): specialty-types only; ignored by the API for other tables.
  defaultAmount?: number | null;
  // WP-39 (PR-2): specialty-types only; rides structural Admin.Lookups.SpecialtyType.Manage.
  offeredOnSite?: boolean | null;
}

export interface LookupUpdateRequest {
  abbreviation?: string | null;
  name?: string | null;
  description?: string | null;
  sortOrder?: number | null;
  // WP-23 (F6): specialty-types only; null/omitted = unchanged.
  defaultAmount?: number | null;
  // WP-39 (PR-2): specialty-types only; null/omitted = unchanged.
  offeredOnSite?: boolean | null;
}

// ── WP-39: specialty price endpoints ────────────────────────────────────────

// GET /api/lookups/specialty-types/{id}/prices — full history, newest-first per duration.
export interface SpecialtyPriceHistoryRow {
  durationMinutes: number;
  amount: number;
  effectiveFrom: string; // "yyyy-MM-dd"
  isCurrent: boolean;
}

export interface SpecialtyPriceHistory {
  specialtyTypeId: number;
  defaultAmount: number | null;
  offeredOnSite: boolean;
  prices: SpecialtyPriceHistoryRow[];
}

// PUT /api/lookups/specialty-types/{id}/prices — APPEND-ONLY: adds effective-dated rows,
// never mutates history. 400 invalid (duration ∉ {30,45,60,90,120} / amount < 0),
// 403 without Specialties.Prices.Edit, 409 duplicate (duration, effectiveFrom).
export interface SpecialtyPriceAppendRow {
  durationMinutes: number;
  amount: number;
  effectiveFrom: string; // "yyyy-MM-dd"
}

export interface SpecialtyPricesUpdateRequest {
  prices: SpecialtyPriceAppendRow[];
}
