# Test Scenarios — Chunk 6 follow-up: modal sweep

Branch: `feature/remediation-2026-6b-modal-sweep`

Consolidates remaining form modals onto the shared error/form infrastructure (no UX change). Note:
none of these had dynamic HTTP-client imports (those were all removed in Chunk 6), so this is purely
boilerplate/error-display consolidation.

## Migrated
- **`SiteFormModal`** → `useModalForm` + `<FormErrorBanner>` (standard async-save modal).
- **`PaymentFormModal`** → `useModalForm` + `<FormErrorBanner>`; preserved the 2-step wizard, the
  `isFullyAllocated` save gate, and the allocation summary bar (which also uses `bg-red-50` for
  over-allocation — left untouched, it is not the error banner).
- **`LookupFormModal`** → `useFormError` + `<FormErrorBanner>` only (it delegates the save to its
  parent via `emit('submit', …)`, so the full `useModalForm.submit()` wrapper doesn't apply).

## Deferred (documented)
- **`BookingFormModal`**, **`TreatmentPlanFormModal`** — these use a differently-named `saveError`
  ref and a **different banner style** (`bg-red-50 border border-red-200` + nested `<p>`). Migrating
  would change their appearance (UX regression risk) for no functional gain. Left as-is.

## Scenarios (no UX change expected)
1. **Site** add/edit → required-field blank shows the red banner; Save disabled while shown; valid save closes + refreshes.
2. **Lookup** (Admin → a lookup table) add/edit → required-field validation banner; submit delegates to parent (saves) and closes.
3. **Payment** (Billing → Record Payment):
   - Step 1 validation (caretaker / amount > 0 / type) shows the banner; Next advances only when valid.
   - Step 2: Save is disabled until **fully allocated**; over-allocation summary bar still turns red;
     a server error on save shows in the footer banner; successful save closes + refreshes.

## Automated checks
- `npx vue-tsc --noEmit` — clean.
- `npm run lint` — clean.
- `npm run build` — succeeds.
