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
}
