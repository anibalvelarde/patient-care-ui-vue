# WP-14.5 — Reverse a Service Payment — User Test Scenarios

Extends WP-14C. Adds a **Reverse** action to the **History** tab on `/service-payments`. Reversal is
**append-only**: it never edits or deletes the original — it writes one offsetting negative payment and
re-opens the covered sessions as unpaid. Reversing is **MGR-only** (`ServicePayments.Adjust`).

Prereqs: API + UI on the `feature/wp-14-5*-reverse-*` branches (or merged), the regenerated RoleClaim
seed applied to the DB, and re-login so the JWT carries the new `ServicePayments.Adjust` claim.

## 1. Reverse a payment (sign in as MGR)
1. Sidebar → **Payroll** → **History**. Pick a therapist + range, **View History**.
2. On a normal payment row, click **Reverse** (red link in the Actions column).
**Expect:** a confirmation modal showing the offsetting amount and how many sessions re-open, with a
**required Reason** field. The **Reverse payment** button stays disabled until a reason is typed.
3. Enter a reason (e.g. "Issued to the wrong therapist") → **Reverse payment**.
**Expect:** the modal closes and the list refreshes. The original row now shows a grey **Reversed**
badge with no Reverse action; a new row appears with a **Reversal of #N** badge and a red negative
amount.

## 2. Correct a payment = reverse then re-issue (MGR)
1. After reversing in scenario 1, go to the **Pay Therapist** tab for that therapist + period.
**Expect:** the sessions the reversed payment had covered are **owed again** and selectable.
2. Issue a corrected payment.
**Expect:** the therapist's statement reads authoritative with the corrected amount due.

## 3. Guard rails (MGR)
- A **Reversed** original has no Reverse action (can't reverse twice).
- A **Reversal of #N** entry has no Reverse action (can't reverse a reversal).
- Submitting with a blank reason is blocked client-side; the API also rejects it (400).

## 4. Permissions
- **AM:** History is visible (view-only), but there is **no Actions column / Reverse button** — AM lacks
  `ServicePayments.Adjust`. Direct `POST /api/service-payments/{id}/reverse` returns **403**.
- **FD:** no **Payroll** nav at all; `/service-payments` redirects to the dashboard.
