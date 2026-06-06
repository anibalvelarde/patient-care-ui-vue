# Test Scenarios — Remediation 2026 Chunk 6 (UI Structural Cleanup)

Branch: `feature/remediation-2026-6-ui-cleanup`

## What changed
- **`useModalForm()` composable** — wraps `useFormError` (3B) + a `saving` flag + a `submit(action)`
  helper that runs the standard modal save flow (clear error → saving=true → try action → catch →
  `setFromException` → finally saving=false). Removes the repetitive try/catch/finally boilerplate.
- **Static HTTP-client imports** — all 5 dynamic `await import('../../services/XxxHttpClient')` calls
  inside submit handlers (and the Therapist specialty loader) replaced with top-of-file static imports.
- **Reference migrations:** `PatientFormModal`, `TherapistFormModal`, `CaretakerFormModal` now use
  `useModalForm` + `<FormErrorBanner>` + static imports — **identical UX** to before.

## Scenarios (no UX regression expected)

### 1. Caretaker add/edit
1. Caretakers → Add Caretaker; submit with a required field blank → red banner "Please fill in all
   required fields.", **Save disabled** while shown; editing a field clears it.
2. Fill valid data → saves, modal closes, list refreshes. Edit an existing caretaker → same.
3. Trigger a server error (e.g. duplicate email) → banner shows the API message (`ProblemDetails.detail`).

### 2. Patient add/edit (incl. the temp-MRN guard)
1. Add/edit a patient → same banner + disable-save behavior.
2. Edit a patient with a **temporary MRN** and toggle Active on → banner "Cannot activate a patient
   with a temporary MRN…" appears **without** hitting the API (pre-submit validation).
3. Assign a permanent MRN + activate → two-step update still works (no behavior change).

### 3. Therapist add/edit (incl. specialty validation)
1. Add a therapist with no specialty selected → "At least one specialty is required." under the
   specialty section; selecting one clears it.
2. Required-field-blank → main banner. Valid → saves; specialty options still load on open
   (now via static `LookupHttpClient`).

### 4. Save button + concurrency
- In all three, the Save button is disabled while `saving` or while an error banner is shown; a
  double-click cannot fire two saves (`submit()` ignores re-entrant calls while saving).

## Automated checks
- `npx vue-tsc --noEmit` — clean.
- `npm run lint` — clean.
- `npm run build` — succeeds; **no `await import()` of HTTP clients** remains in the migrated modals.

## Not in scope (tracked follow-up)
The remaining 5 form modals (`Site`, `Payment`, `TreatmentPlan`, `Booking`, `Lookup`) still use local
form state. Migrating them to `useModalForm` is a tracked follow-up sweep (see the Chunk 6 sub-plan).
