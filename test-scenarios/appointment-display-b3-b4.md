# Test Scenarios — B3 caretaker in Session Details + B4 specialty on dashboard rows

**Origin:** 2026-07-07 meeting punch list, bugs B3 and B4.
**Depends on:** API branch `fix/b3-session-caretaker-fields` (new `caretakerName`/`caretakerPhone`/
`caretakerEmail` on every SessionEvent — deploy API before or with this UI change; without it the
Caretaker row just shows "—").

## B3 — Caretaker contact info in Session Details

### Scenario 1 — Patient with a primary caretaker
1. Appointments → Proposed tab → open "More actions" (Session Details) on any session whose
   patient has a caretaker.
2. **Expect:** Appointment Info now shows **Caretaker** (Last, First), **Caretaker Phone**, and
   **Caretaker Email** rows between Therapist and Date.
3. Cross-check the values against Patients → that patient's caretaker links (primary wins).

### Scenario 2 — Legacy synthetic placeholder caretaker
1. Open Session Details for a legacy-imported patient (most have a synthetic
   `<Name>-SH (LEGACY)` placeholder caretaker).
2. **Expect:** the placeholder name shows; phone/email show "—" (they are genuinely blank).

### Scenario 3 — Patient with no caretaker
1. Open Session Details for a session whose patient has no caretaker link (rare — backfill
   gave everyone a primary).
2. **Expect:** Caretaker row shows "—"; no phone/email rows; no errors.

## B4 — Specialty Type on dashboard appointment rows

### Scenario 4 — Resolved specialty name
1. Dashboard → Appointments panel (any date with sessions).
2. **Expect:** each row's second line reads "<Specialty Name> · <Therapist>"
   (e.g. "Neuro Motor · Smith, Jane") instead of the raw code ("NM · Smith, Jane").

### Scenario 5 — Session without a resolved specialty
1. Find a session with no SpecialtyType link (if any).
2. **Expect:** the row falls back to the raw therapy-type code; "N/A" only when both are absent.
