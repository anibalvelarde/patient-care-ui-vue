// interfaces/Caretaker.ts

// Maps to API's CaretakerProfile response
export interface Caretaker {
  caretakerId: number
  userId: number
  caretakerName: string
  email: string
  phoneNumber: string
  notes: string
  createdTimestamp: string
  lastUpdated: string
  isActive: boolean
  patients: CaretakerPatientSummary[]
}

export interface CaretakerPatientSummary {
  patientId: number
  patientName: string
  isPrimaryCaretaker: boolean
  relationshipToPatient: string | null
}

// Maps to API's CaretakerProfileRequest (POST)
export interface CaretakerCreateRequest {
  firstName: string
  middleName?: string
  lastName: string
  email: string
  phoneNumber: string
  notes?: string
  isActive: boolean
}

// Maps to API's CaretakerProfileUpdateRequest (PUT)
export interface CaretakerUpdateRequest {
  firstName?: string
  middleName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  notes?: string
  isActive: boolean
}
