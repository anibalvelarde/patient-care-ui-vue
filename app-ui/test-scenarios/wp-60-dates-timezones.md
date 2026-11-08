# WP-60 Test Scenarios — Dates & time zones

**What changed:** the app now always uses the **clinic's (Panama) calendar day**. Before, after 7 PM
it behaved as if it were already tomorrow. Date-only values (discovery dates, payment dates, birthdays)
can no longer show the previous day, and change-log times match the wall clock.

**Run against:** API **WP-60B** + this UI build. SYSADMIN login for the change log; MGR is enough for the rest.
**Best run after 7 PM Panama time** (or set the PC clock to an evening time, Panama time zone).

## 1. Evening "today" (F-19)
1. After 7 PM: open **Appointments**. **Expect:** today's date, not tomorrow's. Click **Today** → still today.
2. **Schedule** → **Today**. **Expect:** this week (today highlighted), not next week.
3. **Billing → Record Payment**. **Expect:** the payment date defaults to **today**.
4. **New booking**: the date defaults to today.
5. **Statements** (caretaker and therapist): the "to" date is today, "from" is 90 days earlier.
6. **Run Payroll / Pay Therapist / Apply Late Fees**: their dates default to today.

## 2. Sunday schedule (Q-3)
1. On a Sunday (or pick a Sunday in the Schedule date box): **Expect:** the **coming** Mon–Sat week.

## 3. Dates no longer a day early (F-9)
1. **Treatment Plans**: a patient whose discovery session was on, say, Nov 8 shows **Nov 8** (not Nov 7)
   in the plans list, the plan form and the discovery picker.
2. **Pay Therapist** session list and the "paid in range" disclosure: session dates match the appointment dates.
3. Payment lists, patient birthdays, site inception dates: unchanged and correct.

## 4. Change log (F-15) — SYSADMIN
1. Edit something small (e.g. a session's notes) and note the wall-clock time.
2. Admin → Security → **Change Log**. **Expect:**
   - the entry's time matches the wall clock (it was 5 h off);
   - "changed fields" lists **only** what you changed (e.g. `Notes`), not every column.

## 5. Nothing else moved
- Appointments, statements and payroll totals are unchanged; only default dates and displayed dates were fixed.
