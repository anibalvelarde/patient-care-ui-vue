// interfaces/Patient.ts

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
  hasCompletedDiscovery: boolean | null;
  createdTimestamp: string;
  caretakers?: PatientCaretakerSummary[];
}

export interface PatientCaretakerSummary {
  caretakerId: number;
  caretakerName: string;
  isPrimaryCaretaker: boolean;
  relationshipToPatient: string | null;
}

// Maps to API's PatientProfileRequest (POST)
export interface PatientCreateRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phoneNumber: string;
  gender: string;
  medicalRecordNumber?: string;
  cedula?: string;
  hasSenadisDiscount?: boolean;
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
  cedula?: string;
  // Omit when the caller may not edit it (claim-gated) — omitted/null = unchanged server-side.
  hasSenadisDiscount?: boolean;
}

// Temporary MRN helper
export function isTemporaryMrn(mrn: string | null | undefined): boolean {
  return !mrn || mrn.toUpperCase().startsWith('TEMP-');
}
