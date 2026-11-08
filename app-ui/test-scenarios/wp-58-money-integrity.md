# WP-58 Test Scenarios — Money integrity

**What changed:** payments and session edits can no longer leave a session's *Paid* figure out of
step with the payments actually recorded, and a no-show now costs what the visit would have cost.
Everything else should look the same.

**Run against:** the stack with DB **V037**, API **WP-58B** and this UI build all deployed (the API
needs V037 first). Use an MGR or SYSADMIN login. Pick a test patient whose caretaker you can pay for.

## 1. An open session panel no longer erases a payment (F-18)

1. Appointments → open a session's Actions panel (leave it open). Note **Paid $0.00**.
2. In a **second browser tab**, Billing → Record Payment for that caretaker, allocate **$15** to that session, save.
3. Back in the first tab (the stale panel), Financial → **Edit**, change the discount by $1, **Save**.
- **Expect:** the panel refreshes and shows **Paid $15.00** (not $0.00). Due = net − 15.
- Billing → the payment still shows the $15 allocated to that session.

## 2. Therapist reassign keeps the payment (F-18)

1. With the session from §1 (Paid $15), Actions → **Reassign therapist** → pick another eligible therapist → Reassign.
- **Expect:** therapist changed; **Paid stays $15.00**.

## 3. Payments can't be misallocated (F-1 / F-3 / F-4)

1. Record Payment → the session list only offers the caretaker's own patients' sessions (as before).
2. Edit an existing payment, change only the date, save. **Expect:** saves; allocations unchanged.
- *(The cross-family and bad-caretaker cases are API guards: see `patient-care-api/test-scripts/wp-58b-money-integrity.sh`.)*

## 4. No-show = what the patient would have paid (owner ruling Q-1)

1. Book a **SENADIS** patient's session priced **$50** (shows Discount $10, Due $40).
2. Actions → Change Status → **No Show**.
- **Expect:** the confirm line reads **"A no-show fee of 100% of $40.00 (= $40.00) will be charged."**
3. Mark No Show. **Expect:** Amount **$40.00** "no-show fee", Discount $0.00, Due $40.00.
4. A non-SENADIS $75 session no-shows at **$75.00**, as before.

## 5. Ledger health

1. Admin → About (or `GET /api/health/checks`) → **ledgerReconcile: Healthy**.
- If it ever shows **Degraded**, its data lists the first session IDs whose Paid figure doesn't match their payments. Report them.
