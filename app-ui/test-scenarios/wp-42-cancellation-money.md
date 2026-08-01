# WP-42C — Cancellation & No-Show Money UX: owner walkthrough

Cancelling (or recording a **Declined** confirmation) now **zeroes** a session's money at the
API, and marking **No Show** charges the site's **no-show fee** (a % of the booked amount,
default 30%). The UI now: warns before those transitions, states the fee that will apply,
surfaces the API's guard messages when money has already moved, and lets a **System
Administrator** configure the per-site fee %.

**Prereqs:** DB **V032** applied, API **WP-42B** deployed, this UI (WP-42C) deployed.
No reseed and **no re-login needed** — the fee edit is gated by the SYSADMIN *role*, not a
new claim.

## Scenario 1 — SYSADMIN edits the site's no-show fee

1. Sign in as the **System Administrator**. Open **Admin → Sites**, edit a site.
2. **Expected:** below "On-site trip charge" there is a new **"No-show fee (% of booked
   amount)"** number field showing the current value (fresh V032 install: `30`), with helper
   text: the fee is this % of the booked amount, charged on No Show; **0 = no fee**.
3. Change it (e.g. `25.5`) and Save. Re-open the site. **Expected:** the new value stuck.
4. Try `150` (or `-5`). **Expected:** a friendly client-side error — *"No-show fee must be a
   percentage between 0 and 100."* — nothing is saved.

## Scenario 2 — MGR sees the fee read-only

1. Sign in as a **Manager** and open **Admin → Sites**, edit the same site.
2. **Expected:** the no-show fee shows as a **read-only** gray value (e.g. `25.50%`) — no
   input box — with the note *"Only a System Administrator can change it."*
3. Change something else (e.g. the address) and Save. **Expected:** the save succeeds — the
   stored fee is echoed unchanged, so the API's SYSADMIN field-gate does not trip.

## Scenario 3 — cancel a session that carries money

1. As front desk or MGR, open a booked (not yet paid) session's details panel and expand
   **Cancel Appointment**.
2. **Expected:** an amber note above the reason box: *"Cancelling zeroes this session's money
   (amount $X.XX, discount, therapist pay). The original figures are stamped into the session
   notes."*
3. Cancel it. **Expected:** the session goes Cancelled; re-open its details — Amount /
   Discount are **$0.00** and the Notes carry a `[CANCELLED-ZEROED yyyy-MM-dd: was A:.. …]`
   marker with the original figures.

## Scenario 4 — cancel a zero-money session (no note)

1. Open the details of an already-zeroed (or $0) session that is still cancellable.
2. Expand **Cancel Appointment**. **Expected:** **no** amber money note — there is nothing to
   zero — just the reason box and button.

## Scenario 5 — no-show fee confirm step

1. Open a booked session's details (e.g. booked at $85.00 at a site with a 30% fee), expand
   **Change Status & Treatment Plan**, click **No Show**.
2. **Expected:** the status does NOT change yet. A red confirm box appears: *"A no-show fee of
   30% of $85.00 (= $25.50) will be charged."* with **Mark No Show** / **Back** buttons.
   (If the site can't be read, a generic *"The site's no-show fee will apply to this
   session."* line shows instead — the API applies the real fee either way.)
3. Click **Back**. **Expected:** the box closes, nothing changed.
4. Click **No Show** again, then **Mark No Show**. **Expected:** the session goes No Show;
   its details now show Amount = the fee (e.g. **$25.50**), Discount $0.00, and the Notes
   carry a `[NOSHOW-FEE yyyy-MM-dd: was A:.. …]` marker. (Provider amount — MGR/AM view —
   is $0: the clinic keeps 100% of the fee.)

## Scenario 6 — money-moved sessions are blocked (guards)

1. Pick a session with a **recorded payment** (AmountPaid > 0). Try to cancel it.
   **Expected:** a red error in the panel: *"Payments are recorded against this session;
   money-moved cancellations are refund territory."* The session is unchanged; the panel
   stays open.
2. Pick a session covered by a **payroll service payment** (Run Payroll allocated it, not
   reversed). Try to cancel or mark No Show — or edit its Amount/Discount, or reassign the
   therapist. **Expected:** a red error: *"This session is covered by a service payment —
   reverse the covering payment first."* Reverse the covering payment (Service Payments →
   Reverse), retry — now it goes through.

## Scenario 7 — Declined confirmation = cancel

1. Open a **Proposed** session that carries money and expand **Record Confirmation Attempt**.
2. Select **Declined**. **Expected:** the same amber zeroing note appears above the submit
   button (Declined routes to Cancelled).
3. Submit. **Expected:** session Cancelled, money zeroed with the `[CANCELLED-ZEROED …]`
   marker. On a money-moved session the same guard errors as Scenario 6 appear and **no
   confirmation attempt is recorded**.

## Scenario 8 — deployed-app spot-check (ties to shipped PR #89)

1. On the dashboard, jump to a day whose only session is a **cancelled** one.
2. **Expected:** the payment tiles read **Pending 0 / Cancelled 1** (cancelled/no-show rows
   are excluded from the payment buckets), and the row shows a **"Cancelled"** state chip —
   never a "Pending" chip or a **Pay** button.

---

**Not in this build (future nicety):** a passive "money moved — locked" hint on covered
sessions *before* attempting an edit — the session read model doesn't expose allocations, so
the lock currently surfaces on the API's 400 (Scenario 6). Adding an indicator field to the
wire would enable a pre-emptive hint.

**Older-API tolerance:** against a pre-WP-42B API the site fee field is absent from the wire —
the Sites form then hides the fee UI entirely and never sends the field; the no-show confirm
step falls back to the generic fee line.
