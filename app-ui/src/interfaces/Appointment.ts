// interfaces/Appointment.ts
export interface Appointment {
    sessionId: number;
    sessionDate: string;
    sessionTime: string;
    patient: string;
    therapist: string;
    therapyTypes: string;
    amount: number;
    discount: number;
    amountPaid: number;
    amountDue: number;
    isPastDue: boolean;
    isPaidOff: boolean;
    notes: string;
    patientId: number;
    therapistId: number;
    time: string;
    appointmentStatusId: number;
    statusName: string;
    isConfirmed: boolean;
    siteId: number | null;
    siteName: string | null;
    specialtyTypeId: number | null;
    specialtyAbbreviation: string | null;
    specialtyName: string | null;
    isDiscovery: boolean | null;
    // B3: primary caretaker contact info (first link as fallback; null when the patient
    // has no caretaker) — see _contracts/sessions-api.md.
    caretakerName: string | null;
    caretakerPhone: string | null;
    caretakerEmail: string | null;
    // WP-17: confidential (matrix grants Appointments.ProviderAmount to MGR/AM only). The API omits
    // this field from the response for callers lacking the claim (e.g. FrontDesk), so it is optional.
    providerAmount?: number;
}

export interface SessionEventRequest {
    sessionDate: string;
    sessionTime: string;
    patientId: number;
    therapistId: number;
    therapyType: string;
    duration: number;
    amount: number;
    discount: number;
    providerAmount: number;
    isPaidOff: boolean;
    notes: string;
    appointmentStatusId: number;
    siteId?: number;
    specialtyTypeId?: number;
}

export interface ConfirmationRequest {
    confirmationMethod: string;
    confirmationResult: string;
    notes?: string;
}

export interface ConfirmationRecord {
    confirmationId: number;
    sessionId: number;
    confirmationMethod: string;
    confirmationResult: string;
    confirmedAt: string;
    notes: string | null;
    createdTimestamp: string;
}
