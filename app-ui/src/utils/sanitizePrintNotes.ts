// WP-35 addendum 3: the printed session-history report goes to an EXTERNAL audience
// (caretakers receiving a record of services) — internal audit markers embedded in session
// notes must not reach it. The ON-SCREEN NotesPopover keeps showing the raw note (staff-facing);
// only the print rendering path runs through this sanitizer.
//
// Exact marker shapes verified in patient-care-api / patient-care-db code (2026-07-27):
//   - "[LEGACY-IMPORT: ...]" — WP-19/WP-24 legacy-backfill provenance
//     (tools/legacy-import/importer/promote.py mints them; the waiver predicate matches
//     `Notes LIKE '%[LEGACY-IMPORT:%'`). Uppercase, colon, "]"-terminated, no nested brackets.
//   - "[MERGED: absorbed Patient #... ]" — PatientMergeService.BuildMergedMarker (WP-22).
//     Same bracket-bounded single-"]" shape.
//
// ONLY these two known families are stripped — bracket-bounded and exact-cased. Arbitrary
// bracketed text a therapist legitimately wrote (e.g. "[follow up next week]") is untouched.
const INTERNAL_MARKER_PATTERN = /\[(?:LEGACY-IMPORT|MERGED):[^\]]*\]/g;

// Strips all internal-marker occurrences, then collapses the whitespace they leave behind
// (runs of spaces/tabs, spaces around line breaks, blank lines) and trims. A note that was
// pure marker comes back as '' — callers treat that exactly like "no notes".
export function sanitizePrintNotes(notes: string | null | undefined): string {
  if (!notes) return '';
  return notes
    .replace(INTERNAL_MARKER_PATTERN, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}
