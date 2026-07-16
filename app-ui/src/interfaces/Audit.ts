// interfaces/Audit.ts
// WP-31 (U1): additive audit block surfaced by the row ⓘ popover. Source of truth:
// patient-care-super/_contracts/patients-api.md (same shape on caretakers + sessions).

export interface AuditInfo {
  createdAt: string;
  updatedAt: string;
  /** Display string: "Lastname, Firstname" or "System" (never a raw id). */
  updatedBy: string;
}
