// interfaces/PatientMerge.ts — WP-22 (F2): duplicate-patient merge (SYSADMIN-only).
// Maps to the API's PatientMergeRequest / PatientMergePreview / PatientMergeResult
// (contract: patient-care-super/_contracts/patients-api.md § WP-22).

export interface PatientMergeRequest {
  survivorPatientId: number;
  eliminatedPatientId: number;
}

export interface PatientMergeIdentity {
  patientId: number;
  userId: number;
  patientName: string;
  medicalRecordNumber: string | null;
  cedula: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  isActive: boolean;
  sessionCount: number;
  planCount: number;
  caretakerCount: number;
}

export interface PatientMergePlannedCounts {
  sessionsToRemap: number;
  plansToRemap: number;
  caretakerLinksToRemap: number;
  caretakerLinksToDedupe: number;
  syntheticCaretakersToDelete: number;
}

export type PatientMergeDisposition = 'remap' | 'dedupe-delete' | 'retire-synthetic';

export interface PatientMergeCaretakerDisposition {
  caretakerId: number;
  caretakerName: string;
  isSynthetic: boolean;
  disposition: PatientMergeDisposition;
  primaryFlagDropped: boolean;
}

export interface PatientMergeFieldFill {
  field: string;
  value: string;
}

export interface PatientMergePreview {
  survivor: PatientMergeIdentity;
  eliminated: PatientMergeIdentity;
  counts: PatientMergePlannedCounts;
  caretakers: PatientMergeCaretakerDisposition[];
  fieldFills: PatientMergeFieldFill[];
  warnings: string[];
  blockers: string[];
}

export interface PatientMergeExecutedCounts {
  sessionsRemapped: number;
  plansRemapped: number;
  caretakerLinksRemapped: number;
  caretakerLinksDeduped: number;
  syntheticCaretakersDeleted: number;
}

export interface PatientMergeResult {
  survivorPatientId: number;
  eliminatedPatientId: number;
  mergeLogId: number;
  counts: PatientMergeExecutedCounts;
  fieldsFilled: string[];
  mergedAtUtc: string;
}
