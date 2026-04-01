// interfaces/Therapist.ts

// Maps to API's TherapistSpecialtyItem response
export interface TherapistSpecialtyItem {
  specialtyId: number;
  abbreviation: string;
  name: string;
}

// Maps to API's TherapistProfile response
export interface Therapist {
  therapistId: number;
  userId: number;
  feePerSession: number;
  feePctPerSession: number;
  therapistName: string;       // "Last, First Middle" from API
  email: string;
  phoneNumber: string;
  createdTimestamp: string;
  isActive: boolean;
  specialties: TherapistSpecialtyItem[];
}

// Maps to API's TherapistProfileRequest (POST)
export interface TherapistCreateRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  feePerSession: number;
  feePctPerSession: number;
  specialtyIds: number[];
}

// Maps to API's TherapistProfileUpdateRequest (PUT)
export interface TherapistUpdateRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  feePerSession: number;
  feePctPerSession: number;
  activeStatus: boolean;
  specialtyIds?: number[];
}
