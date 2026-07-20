# WP-37C — SENADIS Discount Expiration Date: owner walkthrough

The SENADIS discount now carries an optional **expiration date** on the patient profile. An
expired SENADIS stops producing the automatic 20% discount floor at booking — compared against
the **session date being booked** (a session booked for a date on/before the expiry still gets
the floor). An expired SENADIS **never un-checks the flag**: history is preserved and the UI
shows an amber **"SENADIS expired {date}"** badge instead of the floor. The date rides the same
permission as the flag itself (`Patients.SenadisDiscount.Edit`): free at create for any
patient-creating role, **MGR/AM only** on later edits.

**Prereqs:** DB **V031** applied, API **WP-37B** deployed, this UI (WP-37C) deployed. No
RoleClaim reseed and **no re-login needed** — no permission changed. You need one test patient
with the SENADIS flag on (any of the ~30 backfill-era SENADIS patients works, or make one).

## Scenario 1 — MGR sets an expiration date

1. Sign in as a **Manager**. Patients → edit a patient whose **SENADIS discount** box is checked.
2. **Expected:** below the SENADIS checkbox there is now a **"SENADIS expiration date"** field
   (it only appears while the flag is checked — uncheck the flag and it disappears), with the
   hint *"Leave blank for no expiry. An expiry already on file can be extended, not cleared."*
3. Set the expiry to a date **next month**, save, and re-open the patient.
4. **Expected:** the date is stored and shown; **no** expired badge (the date is still ahead).
5. Now edit again and set the expiry to a date **last month**, save, re-open.
6. **Expected:** an amber badge **"SENADIS expired {date}"** under the date field, and the
   flag checkbox is **still checked** — expiry never clears the flag.

## Scenario 2 — FD sees the expiry read-only on existing patients

1. Sign in as a **Front Desk** user and edit the same patient.
2. **Expected:** the SENADIS checkbox AND the expiration date are both **greyed out /
   disabled** (same *"Only Managers / Assistant Managers…"* note as before). The expired badge
   from Scenario 1 is still visible — FD can see *why* no discount will apply, just not
   change it.
3. Change something harmless (e.g. phone number) and save.
4. **Expected:** the save succeeds — FD editing an unrelated field never trips the SENADIS
   permission (the app omits the gated fields; the API treats omitted as unchanged).

## Scenario 3 — booking: session date vs expiry (the money behavior)

Use the patient from Scenario 1 (expiry now in the past, flag on) after temporarily setting
the expiry to a **known nearby date** as MGR — e.g. the 15th of this month.

1. Sign in as **Front Desk** (booking is the FD workflow). Appointments → Book Appointment,
   pick the SENADIS patient, pick any specialty so Amount pre-fills.
2. Set the session **Date to on/before the expiry** (e.g. the 14th or the 15th itself).
3. **Expected:** the familiar violet **"SENADIS: min {20% of amount} (20%)"** hint shows, the
   info toast fires on patient selection, and the Discount clamps up to 20% of Amount — you
   cannot save less (exactly the pre-WP-37 behavior; the 15th itself still counts — boundary
   is NOT expired).
4. Now change only the session **Date to after the expiry** (e.g. the 16th).
5. **Expected:** the violet hint disappears and an amber line appears instead:
   **"SENADIS expired {date} — no discount floor for this session date."** The Discount field
   accepts any value now (try 0 — it sticks). Book it.
6. **Expected:** the booking saves with your entered discount — the server no longer floors it
   (verify the created session's Discount in the appointments list).
7. Flip the date back on/before the expiry once more. **Expected:** the hint returns and the
   discount clamps back up — the check follows the session date live.
8. Cleanup for this scenario: as MGR, extend the patient's expiry back to its real value (or
   far future). Remember: an expiry can be **extended, not cleared** — pick a far date rather
   than trying to blank it.

## Scenario 4 — no expiry = nothing changed

1. As FD, book a session for a SENADIS patient **without** an expiration date (backfill-era
   patients are all like this).
2. **Expected:** exactly the pre-WP-37 behavior — toast, violet min hint, 20% clamp, no badge,
   for any session date.

## Scenario 5 — bulk scheduling (treatment-plan wizard)

1. As MGR, open a treatment plan for the expired-SENADIS patient (expiry in the past) and
   start **Schedule** with a start date after the expiry.
2. **Expected:** the per-line discounts do **not** auto-fill to the 20% floor, the per-line
   violet min hint is replaced by the amber **"SENADIS expired {date} — no discount floor for
   this schedule"** note, and discounts below 20% are accepted.
3. Note: the wizard judges expiry by the schedule **start date**. A schedule that *starts*
   on/before the expiry keeps the 20% pre-fill for all its lines, but the server floors **per
   session date** — sessions falling after the expiry are booked with your entered values, not
   force-floored.

## Scenario 6 — FD can set the expiry at CREATE (SEN-2)

1. As **Front Desk**, add a brand-new patient; check **SENADIS discount**.
2. **Expected:** the expiration date field appears and is **editable** (create is free for any
   patient-creating role — the MGR/AM gate applies to later edits only).
3. Save with a date, then re-open the patient as FD. **Expected:** flag + date stored; both now
   read-only for FD.

## Cleanup

Restore the test patient's real expiration date (or a far-future one) as MGR, and delete any
throwaway bookings/patients created above. If you created a test patient in Scenario 6, an MGR
can deactivate it.
