// interfaces/Patient.ts

// Maps to API's PatientProfile response
export interface Patient {
  patientId: number;
  userId: number;
  patientName: string;       // "Last, First Middle" from API
  medicalRecordNumber: string;
  dateOfBirth: string;
  email: string;
  phoneNumber: string;
  gender: string;
  isActive: boolean;
  createdTimestamp: string;
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
}

// Temporary MRN helper
export function isTemporaryMrn(mrn: string): boolean {
  return !mrn || mrn.toUpperCase().startsWith('TEMP-');
}
