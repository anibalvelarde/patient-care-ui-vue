// WP-56C — caretaker ↔ patient relationship values. Mirrors the API's `CaretakerRelationships`
// (WP-55B) and the PatientCaretaker.RelationshipToPatient DB enum. Lockstep-guarded.

export const CaretakerRelationship = {
  Father: 'Father',
  Mother: 'Mother',
  Relative: 'Relative',
  HiredHelp: 'HiredHelp',
  LegalGuardian: 'Legal-Guardian',
  Self: 'Self',
} as const;

export type CaretakerRelationshipValue =
  (typeof CaretakerRelationship)[keyof typeof CaretakerRelationship];

export const ALL_CARETAKER_RELATIONSHIPS: readonly CaretakerRelationshipValue[] =
  Object.values(CaretakerRelationship);

export const CARETAKER_RELATIONSHIP_LABEL: Readonly<Record<CaretakerRelationshipValue, string>> = {
  Father: 'Father',
  Mother: 'Mother',
  Relative: 'Relative',
  HiredHelp: 'Hired Help',
  'Legal-Guardian': 'Legal Guardian',
  Self: 'Self',
};

/**
 * Options for the MANUAL relationship pickers (WP-56 G4): everything except `Self`, which is minted
 * only by the WP-50 "their own caretaker" button. "None" (null) is rendered by each picker itself.
 */
export const RELATIONSHIP_DROPDOWN_OPTIONS: readonly { value: CaretakerRelationshipValue; label: string }[] =
  ALL_CARETAKER_RELATIONSHIPS
    .filter(r => r !== CaretakerRelationship.Self)
    .map(r => ({ value: r, label: CARETAKER_RELATIONSHIP_LABEL[r] }));

/** Case-insensitive, matching the API's OrdinalIgnoreCase Self check. */
export function isSelfRelationship(relationship: string | null | undefined): boolean {
  return (relationship ?? '').toLowerCase() === CaretakerRelationship.Self.toLowerCase();
}
