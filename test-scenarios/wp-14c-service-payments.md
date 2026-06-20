# WP-14C — Service Payments (Therapist Payroll) — User Test Scenarios

These exercise the new **Service Payments** page (`/service-payments`, nav label **Payroll**) and the
statement integration. Run against a live API + DB with the WP-14A RoleClaim seed applied
(MGR holds `ServicePayments.View` + `.Record`; AM holds `.View`; FD holds neither).

Sign in as the role noted in each scenario.

---

## 1. Issue a quincena payment (sign in as MGR)
1. Click **Payroll** in the sidebar → lands on the **Pay Therapist** tab.
2. Pick a therapist. Note the **From/To** dates default to the current quincena (1st–15th or 16th–EOM).
3. Click **Find Unpaid Sessions** → completed sessions with a remaining provider amount load, all
   pre-selected, with a running **total**.
4. Deselect one session → the total drops by that session's provider amount.
5. Pick a **Payment Method**, optionally enter a reference and notes, leave **Payment Date** as today.
6. Click **Issue Payment** → green confirmation appears ("… recorded for <therapist>"), and the page
   switches to the **History** tab.
**Expect:** the new payment is recorded; the confirmation offers a **View Statement** link.

## 2. Statement flips to authoritative (sign in as MGR or AM)
1. After scenario 1, go to **Statements → Therapist**, generate the statement for the same therapist
   and period.
**Expect:** the amber **"Estimated — Service Payments not yet tracked"** banner is **gone**; the
**Service Payments** section lists the payment; **Service Payments** total in the summary is non-zero;
**Estimated Amount Due** = Provider Amount − Service Payments.

## 3. History view (sign in as MGR or AM)
1. On **Payroll → History**, pick the therapist + a range covering scenario 1, click **View History**.
**Expect:** the payment appears with date, amount, method, reference, session count, and notes.

## 4. Empty unpaid list (sign in as MGR)
1. On **Pay Therapist**, pick a therapist with no completed-unpaid sessions in range (or a future range)
   and click **Find Unpaid Sessions**.
**Expect:** "No unpaid completed sessions for this therapist in the selected period."

## 5. Cross-period payment note (sign in as MGR or AM)
1. Issue a payment whose sessions span two periods (or pay a session, then view a statement whose range
   only partially overlaps that payment).
**Expect:** the statement's Service Payments entry still lists the payment; its notes include a clause
that it "Covers sessions outside this period."

## 6. Permission visibility
- **AM:** the **Payroll** nav item is visible; opening it shows **only** the **History** tab (no
  "Pay Therapist" tab — AM cannot issue). Attempting `POST` (not reachable from the UI) would 403.
- **FD:** the **Payroll** nav item is **absent**; navigating directly to `/service-payments`
  redirects to the dashboard (no `ServicePayments.View`). FD also never sees provider/payout figures.

## 7. Over-allocation guard (sign in as MGR)
1. (If exercising the API directly) attempt to apply more than a session's remaining provider amount.
**Expect:** the API returns `400` and the UI surfaces the error message; no payment is recorded.
