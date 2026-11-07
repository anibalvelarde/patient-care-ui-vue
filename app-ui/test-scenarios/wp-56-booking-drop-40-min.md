# WP-56 G5 Hotfix — Booking form no longer offers 40 minutes

**Why:** WP-55 (gate G5) ruled bookable durations are **30 / 45 / 60 / 90 / 120 only**, reversing
the 2026-07-27 "40 for interviews" addendum. The WP-55B API (v146, live on K3s since ~2026-08-24)
rejects 40 with a 400, but the UI kept offering it, so choosing 40 errored at the front desk.
This hotfix removes 40 from the booking dropdown. It is the first slice of WP-56; the full
constants refactor (WP-56C) follows separately.

**Run against:** the deployed stack after this UI build is live (no API/DB change; no re-login needed).

## 1. The 40 option is gone

1. Log in as **Front Desk** → Appointments → **Book Appointment**.
2. Open the **Duration (min)** dropdown.
   - **Expect:** exactly **30, 45, 60, 90, 120**, with **60** pre-selected. **No 40.**
3. Repeat as **Manager**: same five options.

## 2. Booking still works at every offered duration

1. Pick a non-SENADIS patient, a priced specialty (e.g. TC), a therapist, and a free slot.
2. Book once at **45** and once at **90**.
   - **Expect:** both bookings succeed (no "server error"/400), and the Amount shown in the form
     matches the saved session.
3. For a specialty with no 45-min price row, choose 45.
   - **Expect:** the amber "using the default amount" badge appears and the booking proceeds at
     the default amount (same fallback as before; only the 40 option changed).

## 3. Existing 40-minute sessions are untouched

1. Open any session that was **already booked at 40 min** before the WP-55B deploy (if one exists).
   - **Expect:** it still opens and shows 40 min; editing it via the Actions panel does not change
     the stored duration (the edit PUT omits duration).

## Not in scope

- Price-sheet editor (Admin → specialty prices) already used 30/45/60/90/120 and is unchanged.
- Everything else in WP-56 (status constants, Legal-Guardian in relationship dropdowns) ships later.
