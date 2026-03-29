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
}

// Maps to API's SiteProfileRequest (POST)
export interface SiteCreateRequest {
  siteName: string;
  ruc?: string;
  inceptionDate: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

// Maps to API's SiteProfileUpdateRequest (PUT)
export interface SiteUpdateRequest {
  siteName?: string;
  ruc?: string;
  inceptionDate?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}
