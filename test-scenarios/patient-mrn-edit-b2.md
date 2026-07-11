# Test Scenarios — B2: MRN editable in the patient edit modal

**Origin:** 2026-07-07 meeting punch list, bug B2 ("Inactive patient with a temp MRN: the UI
won't allow correcting the MRN"). Root cause: the edit modal rendered the MRN read-only unless
it was `TEMP-`-prefixed, so imported `L24-/L25-/L26-####` MRNs could never be corrected — and
the PUT payload dropped the MRN except on the assign-permanent path.

**Fix:** the MRN field is now always editable in the edit modal. A changed, non-blank value is
sent to the API (uniqueness enforced server-side → 409 with a specific message). Blank means
"keep the current MRN". `TEMP-` semantics (activation block, two-step assign+activate) are
unchanged.

## Scenario 1 — Correct an imported legacy MRN
1. Patients → find any legacy patient (MRN like `L24-0123`) → Edit.
2. **Expect:** the MRN shows in an editable input (was a grey read-only box), with the hint
   "Changing the MRN must keep it unique; leave blank to keep the current one."
3. Change the MRN to a new unique value → Save Patient.
4. **Expect:** save succeeds; the table shows the corrected MRN.

## Scenario 2 — Duplicate MRN is rejected cleanly
1. Edit a patient and set their MRN to another patient's existing MRN → Save.
2. **Expect:** error banner "A patient with this Medical Record Number already exists."
   (409 from the API); no data changes.

## Scenario 3 — Blank keeps the current MRN
1. Edit a patient, clear the MRN field entirely, change something else (e.g. phone) → Save.
2. **Expect:** save succeeds; the MRN is unchanged (blank does not erase an MRN).
3. On an **active** patient this must not trigger the "Cannot activate with a temporary MRN"
   error.

## Scenario 4 — Temp-MRN flow unchanged (regression)
1. Create a patient with a blank MRN (gets `TEMP-{id}`, inactive).
2. Edit them: **expect** the amber input + "temporary MRN" hint; the Active toggle is disabled
   until a permanent MRN is typed.
3. Type a permanent MRN, toggle Active on, Save.
4. **Expect:** patient is active with the new MRN (two-step update under the hood).
