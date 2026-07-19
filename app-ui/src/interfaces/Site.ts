// interfaces/Site.ts

// Maps to API's SiteProfile response
export interface Site {
  siteId: number;
  siteName: string;
  ruc: string | null;
  inceptionDate: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  idleLogoffMinutes: number; // WP-32 (U4): idle auto-logoff minutes; 0 = disabled
  onSiteTripChargeAmount: number; // WP-39 (G4): flat trip charge per on-site visit; 0 = none
}

// Maps to API's SiteProfileRequest (POST)
export interface SiteCreateRequest {
  siteName: string;
  ruc?: string;
  inceptionDate: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  idleLogoffMinutes?: number; // optional; API defaults to 60
  onSiteTripChargeAmount?: number; // WP-39: optional; API defaults to 0; must be >= 0
}

// Maps to API's SiteProfileUpdateRequest (PUT)
export interface SiteUpdateRequest {
  siteName?: string;
  ruc?: string;
  inceptionDate?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  idleLogoffMinutes?: number; // null/omitted = unchanged; API clamps 0-480
  onSiteTripChargeAmount?: number; // WP-39: null/omitted = unchanged; must be >= 0
}
