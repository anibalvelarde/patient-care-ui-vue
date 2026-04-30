# WP-13C — Therapist Statement UI: User Test Scenarios

**Branch:** `feature/wp-13c-therapist-statement-ui`
**Companion plan:** `patient-care-super/planning/active/wp-13-therapist-statement.md`
**API dependency:** WP-13B on branch `feature/wp-13b-therapist-statement-api`

These are end-to-end scenarios the clinic owner (Anibal) should walk through to validate the
Therapist tab + tab refactor. The Caretaker tab regression scenario is included to confirm
that the rename and tab restructure did not break the existing Caretaker statement flow.

---

## Scenario 1 — Generate a therapist statement

**As an owner**, navigate to **Statements** → click the **Therapist** tab → pick a therapist from the
dropdown → leave the default 90-day range → click **Generate Statement**.

**Expected:**
- Per-patient blocks render (one block per patient that the selected therapist treated in the period).
- Each block shows session rows with Date · Time · Therapy Type · Status · Fee · Discount · Provider Amount.
- Each block has a Subtotal row showing per-patient totals.
- Summary box at the bottom shows totals for completed sessions, non-billable sessions, fee, discount, provider amount, service payments, and a large/bold Estimated Amount Due.
- Estimated Amount Due is greater than zero if the therapist had any Completed sessions in the range.
- Pro-forma amber banner is visible at the top of the report.

---

## Scenario 2 — Custom date range

Same as Scenario 1, but **set a 14-day range** matching a quincena window (e.g., the 1st through the 15th of the current month).

**Expected:**
- Only sessions whose `sessionDate` falls within that 14-day window appear.
- Subtotals and summary reflect the narrower window.
- The period display in the report header shows the chosen From / To dates.

---

## Scenario 3 — Mixed statuses (Completed + Cancelled + NoShow)

Pick a therapist who had at least one **Cancelled** and one **NoShow** session in the range.

**Expected:**
- Cancelled and NoShow rows are visible alongside Completed rows.
- Cancelled / NoShow rows show their Provider Amount as `$0.00`.
- Hovering the `$0.00` cell reveals a tooltip: `Non-billable: Cancelled` (or `Non-billable: NoShow`).
- The status badge for non-billable rows is gray (vs. green for Completed).
- The Estimated Amount Due in the summary equals the Total Provider Amount, which sums **only** the Completed rows.
- The patient subtotal row shows the per-patient `completedCount` and `nonBillableCount` next to "Subtotal —".

---

## Scenario 4 — Print / PDF export

With a generated report on screen, click **Print Statement** (or `Ctrl+P`).

**Expected:**
- Print preview shows the report cleanly: clinic name header, therapist name, period.
- Pro-forma amber banner is **visible in the print preview** (it must follow the report into PDF).
- All patient blocks, subtotals, the Service Payments placeholder, and the Summary box are present.
- No UI chrome (sidebar, top bar, mobile nav, tab bar, Back button, Print button) appears in the print preview.
- Patient blocks and the summary box do not split awkwardly across pages where avoidable.

---

## Scenario 5 — Empty range

Pick a therapist plus a date range during which the therapist had no sessions
(e.g., a date range entirely before the therapist was hired, or a vacation week).

**Expected:**
- A friendly "No sessions in this period." empty-state message appears in place of patient blocks.
- The Summary box shows all zeros (0 completed, 0 non-billable, $0.00 totals).
- The pro-forma amber banner is still visible.
- Print Statement still works and produces a clean (but mostly empty) report.

---

## Scenario 6 — Caretaker tab regression

Switch to the **Caretaker** tab.

**Expected:**
- The existing Caretaker statement flow works **identically** to before the WP-13C refactor:
  - Caretaker dropdown loads.
  - From / To date pickers default to 90 days ago and today.
  - Generate Statement produces the existing Caretaker statement layout (charges table, payments table, account summary, past-due callout).
  - Print works as before.
- No regressions, layout shifts, or console errors.

---

## Scenario 7 — Therapy Type fallback

Pick a therapist whose data includes sessions where `SpecialtyTypeId` is null but the
legacy `TherapyTypes` text column on `TherapySession` is set, **and** at least one row where both
are null/empty.

**Expected:**
- For sessions with a non-null FK, the Therapy Type column shows `SpecialtyType.Name`.
- For sessions where the FK is null but legacy text exists, the column shows the legacy text verbatim.
- For sessions where both are null/empty, the column shows `N/A`.
- The fallback is applied **server-side** (the UI just renders the `therapyType` string the API returns); no client-side coercion is needed.

---

## Notes / known limitations

- **Pro-forma flag is hard-wired to `true`** in WP-13B and `servicePayments[]` is always `[]`. The Service Payments section will always render the "No service payments recorded for this period." placeholder until WP-14 (Therapist Payroll) ships and starts flipping the flag.
- The endpoint excludes future-dated `Scheduled` / `Confirmed` sessions deliberately — this is a retrospective payroll-style report.
