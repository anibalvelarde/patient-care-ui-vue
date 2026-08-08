// WP-35 addendum 3: the printed session-history report goes to an EXTERNAL audience
// (caretakers receiving a record of services) — internal audit markers embedded in session
// notes must not reach it. The ON-SCREEN NotesPopover keeps showing the raw note (staff-facing);
// only the print rendering path runs through this sanitizer.
//
// Exact marker shapes verified in patient-care-api / patient-care-db code:
//
// Colon IMMEDIATELY after the name:
//   - "[LEGACY-IMPORT: ...]" — WP-19/WP-24 legacy-backfill provenance
//     (tools/legacy-import/importer/promote.py mints them; the waiver predicate matches
//     `Notes LIKE '%[LEGACY-IMPORT:%'`). Uppercase, colon, "]"-terminated, no nested brackets.
//   - "[MERGED: absorbed Patient #... ]" — PatientMergeService.BuildMergedMarker (WP-22).
//
// SPACE, then a date, THEN the colon — the money-marker family:
//   - "[CANCELLED-ZEROED 2026-07-28: was A:100.00 D:0.00 P:50.00 G:50.00]" — WP-42
//   - "[NOSHOW-FEE 2026-07-28: was A:85.00 ...]"                          — WP-42
//   - "[LATE-FEE 2026-08-08: 30% of 125.00 = 37.50; 80 days unpaid]"      — WP-49/BR3
//   - "[FEE-WAIVED 2026-08-08: late 37.50 waived by u#3; reason: ...]"    — WP-49/BR4
//
// WP-49 (Finding 2) — this pattern was previously `/\[(?:LEGACY-IMPORT|MERGED):[^\]]*\]/g`,
// which required a colon IMMEDIATELY after the marker name. That shape does not exist in the
// money-marker family, so simply adding the names to the alternation would NOT have worked;
// the separator had to become `[: ]`. At the time of the fix three live sessions carried
// [CANCELLED-ZEROED …] notes that were printing on caretaker-facing output.
//
// This is fixed here, in WP-49, rather than left as a pre-existing gap because BR4 puts
// free-text WAIVER REASONS into notes — shipping that on top of a leaking sanitizer would make
// this WP the cause of a new disclosure, not merely a bystander to an old one.
//
// The API sanitizes waiver reasons server-side (stripping "[" and "]") so a hostile reason
// cannot break the bracket-bounded `[^\]]*` match and leak the remainder of the marker.
//
// ONLY these known families are stripped — bracket-bounded and exact-cased. Arbitrary
// bracketed text a therapist legitimately wrote (e.g. "[follow up next week]") is untouched.
//
// The separator is spelled out as "colon, OR whitespace + ISO date + colon" rather than the
// looser "[: ]" character class, because "[: ]" would also match free text that merely starts
// with a marker word — "[LEGACY-IMPORT note without colon]" would silently disappear from a
// caretaker's report. Matching the two shapes that actually exist keeps the near-miss
// guarantee this sanitizer has always made.
const INTERNAL_MARKER_PATTERN =
  /\[(?:LEGACY-IMPORT|MERGED|CANCELLED-ZEROED|NOSHOW-FEE|LATE-FEE|FEE-WAIVED)(?::|\s\d{4}-\d{2}-\d{2}:)[^\]]*\]/g;

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
