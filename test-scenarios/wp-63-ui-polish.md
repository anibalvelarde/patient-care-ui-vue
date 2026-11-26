# WP-63C — UI polish pack — User Test Scenarios

Eight small display/safety fixes from the owner walkthrough. Fixes 5 and 7 show more once the
WP-63B API is deployed (new `specialtyName` / `statusName` / `isFeeWaived` fields). On an older API
those screens behave as before: no crash, no blank columns.

Prereqs: UI on `feature/wp-63c-ui-polish` (or merged), API with WP-63B for scenarios 5 and 7.
Use test records only (e.g. patient "Testpatient, Ana", caretaker "Testcaretaker, Cruz",
therapist "Testtherapist, Bea").

## 1. Schedule matrix status labels (FD)
1. Check in a session for today. Open **Schedule**.
**Expect:** the slot's third line reads **Checked In**, not "CheckedIn". An in-therapy slot reads
**In Therapy** and a no-show reads **No Show**. The legend shows the same labels.

## 2. Friendly times (FD / MGR)
1. Open **Appointments**.
**Expect:** the Time column reads **8:00 AM** / **1:30 PM**, not `08:00:00`.
2. **Statements → Therapist**, pick a therapist and period.
**Expect:** the Time column uses the same 12-hour format, with no seconds.

## 3. Relationship labels (FD)
1. Link "Testcaretaker, Cruz" to "Testpatient, Ana" as **Legal Guardian**.
2. Open the patient → Caretakers panel, then the caretaker → Patients list, then the caretaker's
   **Statement**.
**Expect:** all three read **Legal Guardian** (no hyphen). **Hired Help** shows with a space. A link
with no relationship still reads **No relationship** on the two panels.

## 4. No "Proposed" status button (FD / MGR)
1. Open a **Confirmed** session → Actions panel.
**Expect:** the status buttons are Checked In, In Therapy, Completed, No Show. There is **no Proposed** button.
2. Repeat for **Checked In** and **In Therapy** sessions.
**Expect:** still no Proposed button. **Confirmed** is still offered on a Checked In session.
Clicking it confirms the session, the same as before.

## 5. Record Payment allocation rows (MGR)
1. **Payments → Record Payment**, pick "Testcaretaker, Cruz", enter an amount and type → **Next**.
**Expect:** each unpaid-session row shows the patient, the date and time (e.g. "2026-11-03 8:00 AM"),
the therapist, the **specialty** (e.g. Language Therapy) and a coloured **status** badge
(Completed / No Show / …).
2. Make sure one of the caretaker's sessions is fully paid or $0 (e.g. a cancelled session).
**Expect:** it is **not** listed. Sessions with nothing left to pay never appear.
3. **Auto-allocate oldest first** still fills only the listed sessions.

## 6. Run Payroll asks first (MGR)
1. **Payroll → Run Payroll → Preview Payroll**, choose a payment method.
2. Click **Run Payroll**.
**Expect:** nothing is paid yet. An amber box asks **"Pay N therapists a total of $X?"**, with the
same N and total as the preview footer, plus **Confirm** and **Cancel** buttons.
3. Click **Cancel**.
**Expect:** the box closes, the Run Payroll button comes back, and History has no new payment.
4. Click **Run Payroll** again, then **Confirm**.
**Expect:** the usual green "Payroll run complete — $X across N therapists" summary.

## 7. Caretaker statement status column (MGR / AM)
1. Statement for a caretaker whose period includes: a **cancelled** session, a **no-show with its fee
   waived**, a **no-show with nothing due**, a no-show whose fee is **still owed**, and normal sessions.
**Expect:** in the Status column:
- cancelled → **Cancelled** (previously "Paid")
- waived fee → **Waived**
- no-show with nothing due → **No Show**
- no-show with its fee still owed → **Open**, or **Past Due** if it is overdue (the money status)
- normal sessions → **Paid / Open / Past Due**, as before
2. **Print Statement**.
**Expect:** the new labels print cleanly as grey pills. The rest of the layout is unchanged.

## 8. Therapist statement (MGR / AM)
1. Statement for a therapist with a no-show in the period and no service payment yet.
**Expect:** the no-show row's Status reads **No Show**. Hovering the grey Provider Amount shows
"Non-billable: No Show". The amber note reads "Estimated — no service payments have been recorded
against this period yet…". It no longer says Service Payments are "not yet tracked".
2. Pay that therapist (Run Payroll or Pay Therapist), then reload the statement.
**Expect:** the amber note is gone.
