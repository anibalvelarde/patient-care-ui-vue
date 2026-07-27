// interfaces/Appointment.ts
import type { AuditInfo } from './Audit';

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
    // WP-40: the Site's trip charge snapshotted at booking; null/absent = in-clinic session.
    onSiteChargeAmount?: number | null;
    // WP-40: where the server derived the amount from — "durationPrice" | "defaultAmount";
    // set on the create response only (null on list/read paths).
    amountSource?: string | null;
    // WP-31 (U1): audit block for the Session Details ⓘ popover. Optional — tolerates an older API.
    audit?: AuditInfo;
}

export interface SessionEventRequest {
    sessionDate: string;
    sessionTime: string;
    patientId: number;
    therapistId: number;
    therapyType: string;
    duration: number;
    // WP-40: amount/discount/providerAmount are SERVER-DERIVED — the values sent here are
    // advisory previews the API ignores (price sheet + SENADIS rule + fee model rule).
    amount: number;
    discount: number;
    providerAmount: number;
    isPaidOff: boolean;
    notes: string;
    appointmentStatusId: number;
    siteId?: number;
    specialtyTypeId?: number;
    // WP-40 on-site leg: valid only for offeredOnSite specialties; requires siteId.
    isOnSiteVisit?: boolean;
}

// WP-40: typed PUT /api/sessions/{id} body (previously Record<string, unknown>).
export interface SessionEventUpdateRequest {
    sessionTime: string;
    therapyType: string;
    // WP-40: OMIT to keep the stored duration — the session read model doesn't carry it, and
    // the old hardcoded 60 silently overwrote legacy durations. Only send a value when the
    // user deliberately changes it (validated server-side against {30,40,45,60,90,120}).
    duration?: number;
    amount: number;
    amountPaid: number;
    // Changing discount requires the Sessions.Discount.Edit claim (403 otherwise, BK-3).
    discount: number;
    isPaidOff: boolean;
    notes: string;
    appointmentStatusId?: number;
    therapistId?: number;
    siteId?: number | null;
    specialtyTypeId?: number | null;
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
