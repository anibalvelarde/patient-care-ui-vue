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
  // WP-42 (G1): no-show fee as % of the booked gross amount; 0 = no fee; default 30.
  // OPTIONAL to tolerate an older API — when absent, the UI hides the fee field entirely.
  noShowFeePct?: number;
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
  // WP-42: optional; API defaults to 30; 0-100; a non-default value requires SYSADMIN (403 otherwise)
  noShowFeePct?: number;
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
  // WP-42: null/omitted = unchanged; 0-100 (400 otherwise); a CHANGED value requires the
  // SYSADMIN role (403 otherwise) — non-SYSADMIN callers must ECHO the stored value unchanged.
  noShowFeePct?: number;
}
