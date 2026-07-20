// interfaces/Patient.ts

import type { AuditInfo } from './Audit';

// Maps to API's PatientProfile response
export interface Patient {
  patientId: number;
  userId: number;
  patientName: string;       // "Last, First Middle" from API
  medicalRecordNumber: string | null;
  cedula: string | null;
  dateOfBirth: string;
  email: string | null;
  phoneNumber: string | null;
  gender: string | null;
  isActive: boolean;
  // WP-23 (F7): statutory SENADIS 20% discount — booking applies a 20%-of-amount discount
  // floor; edit gated by Patients.SenadisDiscount.Edit (MGR/AM). Optional so the UI
  // tolerates an older deployed API (absent ⇒ treated as false).
  hasSenadisDiscount?: boolean;
  // WP-37 (SEN-1): SENADIS credential expiry — "2027-06-30T00:00:00" | null. null = no expiry
  // (open-ended, G1). Expired for a booking when expiry < the SESSION date (G2); an expired
  // SENADIS keeps hasSenadisDiscount = true (G3 — badge, never auto-cleared). Optional so the
  // UI tolerates an older deployed API (absent ⇒ treated as no expiry).
  senadisExpirationDate?: string | null;
  // WP-24 (F3/F4): discovery-first waiver — false = exempt from the completed-discovery-
  // before-treatment rule (legacy imports are backfilled false). Default true; edit gated by
  // Patients.RequiresDiscovery.Edit (MGR/AM). Optional so the UI tolerates an older deployed
  // API (absent ⇒ treated as true).
  requiresDiscovery?: boolean;
  hasCompletedDiscovery: boolean | null;
  createdTimestamp: string;
  // WP-31 (U1): audit block for the row ⓘ popover. Optional — the UI tolerates an older API.
  audit?: AuditInfo;
  caretakers?: PatientCaretakerSummary[];
}

export interface PatientCaretakerSummary {
  caretakerId: number;
  caretakerName: string;
  isPrimaryCaretaker: boolean;
  relationshipToPatient: string | null;
}

// Maps to API's PatientProfileRequest (POST)
// WP-36 (NP-1): NO medicalRecordNumber — the server always mints NC{yy}-#### at create (a
// client-supplied value would be ignored server-side); the response carries the minted MRN.
export interface PatientCreateRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phoneNumber: string;
  gender: string;
  // WP-25 (F5): "Cedula | Passport" — required at create (free text, unique; duplicate → 409).
  cedula: string;
  hasSenadisDiscount?: boolean;
  // WP-37 (SEN-1): optional, default null = no expiry. Free at create for any patient-creating
  // role (SEN-2) — the edit gate applies to later PUTs only.
  senadisExpirationDate?: string | null;
  // WP-24 (F3): omitted = true server-side (discovery required by default).
  requiresDiscovery?: boolean;
}

// Maps to API's PatientProfileUpdateRequest (PUT)
export interface PatientUpdateRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phoneNumber: string;
  gender: string;
  activeStatus: boolean;
  medicalRecordNumber?: string;
  // WP-25 (F5): omitted = unchanged server-side (keeps legacy NULL-cedula patients editable).
  // A blank string must never be sent — the API 400s it ("Cedula | Passport cannot be
  // cleared"); the WP-18-followup erase-to-NULL semantics were removed.
  cedula?: string;
  // Omit when the caller may not edit it (claim-gated) — omitted/null = unchanged server-side.
  hasSenadisDiscount?: boolean;
  // WP-37 (SEN-1/G4): rides the SAME Patients.SenadisDiscount.Edit gate as the flag — omit when
  // the caller may not edit it (omitted/null = unchanged server-side). Consequence: an expiry,
  // once set, cannot be cleared back to null via PUT — extend it with a later date instead.
  senadisExpirationDate?: string | null;
  // Omit when the caller may not edit it (claim-gated) — omitted/null = unchanged server-side.
  requiresDiscovery?: boolean;
}

// WP-30 (U2): slim typeahead row from GET /api/patients/lookup?q= — capped at 20,
// ordered by name. Never the full census; pickers render these fields only (gate G3).
export interface PatientLookupItem {
  patientId: number;
  patientName: string;
  medicalRecordNumber: string | null;
}

// WP-36 (NP-1): isTemporaryMrn() removed — the TEMP- flow is retired (prod has zero TEMP- rows;
// the server mints NC{yy}-#### at create and patients are active immediately).
