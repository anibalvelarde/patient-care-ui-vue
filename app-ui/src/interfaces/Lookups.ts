// Generic lookup table interfaces (unified API shape)

export interface LookupItem {
  id: number;
  abbreviation: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

export interface LookupCreateRequest {
  abbreviation: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
}

export interface LookupUpdateRequest {
  abbreviation?: string | null;
  name?: string | null;
  description?: string | null;
  sortOrder?: number | null;
}
