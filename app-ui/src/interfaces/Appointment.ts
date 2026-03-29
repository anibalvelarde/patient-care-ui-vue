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
}

export interface AppointmentStatusInfo {
    appointmentStatusId: number;
    statusName: string;
    statusDescription: string;
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
