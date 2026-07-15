// interfaces/Caretaker.ts

// Maps to API's CaretakerProfile response
export interface Caretaker {
  caretakerId: number
  userId: number
  caretakerName: string
  email: string | null
  phoneNumber: string | null
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

// WP-30 (U2): slim typeahead row from GET /api/caretakers/lookup?q= — capped at 20,
// ordered by name. Never the full census; pickers render these fields only (gate G3).
export interface CaretakerLookupItem {
  caretakerId: number
  caretakerName: string
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
