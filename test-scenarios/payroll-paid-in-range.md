# Test Scenarios — Payroll "paid in range" visibility (WP-20C)

Feature: the Pay Therapist wizard now discloses sessions in the selected range that
were **already paid** by prior service payments — a muted line under the Unpaid
Sessions header ("N sessions ($X) in this range were already paid") with a chevron
that expands into a read-only table (date, patient, therapy type, provider amount,
applied, Full/Partial badge, payment reference). The Run Payroll preview shows a
muted "N paid · $X" sub-line under each therapist name. Context only — nothing new
is selectable or payable. Visible wherever the wizards are (MGR/AM; issuing MGR).

## Scenario 1 — Disclosure line and expanded detail (origin case)
1. Log in as MGR; open Payments → Pay Therapist.
2. Select therapist **ANNELYS** (id 23), range **2026-05-30 → 2026-06-12**, click
   Find Unpaid Sessions.
3. VERIFY the payable table shows **16 sessions**, all pre-selected, with a
   selected-total of **$363.40**.
4. VERIFY a muted line directly under the "Unpaid Sessions" header reads
   **"4 sessions ($85.00) in this range were already paid"** with a chevron.
5. Click the chevron → VERIFY it rotates and a subdued read-only table appears with
   **4 rows dated 2026-05-30**, each showing a **Full** badge and referencing
   **PAYROLL-2026-05** with its applied amount.
6. VERIFY the paid rows have no checkboxes and no links, and the selected-total
   above stays $363.40 (paid rows never enter the payable math).
7. Click the chevron again → VERIFY the table collapses.

## Scenario 2 — Zero case (no paid sessions in range)
1. Same wizard; pick a therapist/range with unpaid sessions but no prior service
   payments in the range (e.g. a fresh JULIO 2026 window).
2. VERIFY no "already paid" line renders at all — the card looks exactly as before
   WP-20 (header bar, then the payable table).

## Scenario 3 — Partially-paid suffix
1. Pick a range containing a session with a partial allocation (some `amountApplied`
   but `remainingProviderAmount > 0`) — e.g. after reversing/re-issuing a smaller
   payment on one session.
2. VERIFY the session still appears in the **payable** list (for its remainder) AND
   in the expanded paid table with a **Partial** badge.
3. VERIFY the disclosure line ends with
   **"(incl. $Y applied on partially-paid sessions shown above)"** where $Y is the
   partial amount, and the singular form reads "1 session … was already paid".

## Scenario 4 — Run Payroll sub-line
1. Open Payments → Run Payroll; preview the range **2026-05-30 → 2026-06-12**.
2. VERIFY the ANNELYS row shows a muted **"4 paid · $85.00"** sub-line under the
   name; her Sessions / Amount Owed figures are unchanged by WP-20.
3. VERIFY therapists with nothing previously paid in range show **no** sub-line,
   and therapists with only paid (nothing owed) sessions still do not appear.

## Scenario 5 — Totals reconcile
1. For the Scenario 1 range, sum: selected-total ($363.40) + paid line total
   ($85.00, plus any partial suffix amount).
2. VERIFY it equals the therapist's total provider amount for all completed
   sessions in the range (invariant: Σ providerAmount = Σ remaining + Σ applied).

## Scenario 6 — Issue payment clears the disclosure
1. From Scenario 1, issue the payment for the 16 sessions.
2. VERIFY the success panel replaces the tables (no stale paid line lingering).
3. Re-run Find Unpaid Sessions for the same range → VERIFY the empty state
   ("No unpaid completed sessions…") renders. The disclosure line lives under the
   Unpaid Sessions header, so it does not appear when nothing is payable (by
   design — see the WP-20 plan).
