# WP-14.5 — Run Payroll (batch all-therapists) — User Test Scenarios

Extends WP-14C. New **Run Payroll** tab on `/service-payments` (the "Payroll" nav item). Pays every
therapist owed money in a window in one pass, with case-by-case opt-out. Single-therapist payments
remain on the **Pay Therapist** tab.

Prereqs: API + UI on the `feature/wp-145-run-payroll` branches (or merged), RoleClaim seed applied,
re-login so the JWT carries `ServicePayments.*`.

## 1. Run payroll for everyone (sign in as MGR)
1. Sidebar → **Payroll** → defaults to the **Run Payroll** tab.
2. Confirm **From/To** default to the current quincena. Click **Preview Payroll**.
**Expect:** a table of every therapist owed in the window — name, session count, total owed — all
pre-checked, with a grand total in the footer.
3. Pick a **Payment Method** + date, click **Run Payroll**.
**Expect:** green summary "Payroll run complete — $X across N therapists", page switches to **History**.
Each therapist now has a ServicePayment; their statements read authoritative for the period.

## 2. Case-by-case opt-out (MGR)
1. On the preview, untick one therapist → grand total drops by that therapist's owed amount; "N
   therapists selected" decrements. Use **Select all** / **Clear**.
2. Run → only the selected therapists are paid; the deselected one still shows as owed on a re-preview.

## 3. Idempotency / no double-pay (MGR)
1. After a run, click **Preview Payroll** again for the same window.
**Expect:** therapists paid in step 1 no longer appear (nothing owed); only newly-owed or
partially-owed therapists remain.

## 4. Empty state (MGR)
1. Preview a window where nobody is owed (e.g. a future range).
**Expect:** "No therapists are owed for this period."

## 5. Exception handling guidance (MGR)
- For a therapist who needs a different method/date than the run, deselect them in Run Payroll and pay
  them individually on the **Pay Therapist** tab. (Run Payroll uses one shared method + date.)

## 6. Permissions
- **AM:** no **Run Payroll** (or **Pay Therapist**) tab — only **History**. (Issuing is MGR-only.)
- **FD:** no **Payroll** nav; `/service-payments` redirects to dashboard.
