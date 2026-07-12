// Generic lookup table interfaces (unified API shape)

export interface LookupItem {
  id: number;
  abbreviation: string;
  name: string;
  description: string | null;
  sortOrder: number;
  // WP-23 (F6): per-type field — populated only for specialty-types (default session price
  // pre-filled at booking; null = no default); null on every other table.
  defaultAmount?: number | null;
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
}

export interface LookupUpdateRequest {
  abbreviation?: string | null;
  name?: string | null;
  description?: string | null;
  sortOrder?: number | null;
  // WP-23 (F6): specialty-types only; null/omitted = unchanged.
  defaultAmount?: number | null;
}
