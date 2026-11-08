# WP-59 Test Scenarios — Double-booking guard

**What changed:** the system now refuses to book a therapist, or a patient, into two sessions at
the same time. Before, the same booking could be saved twice with no warning.

**Rules (owner rulings 2026-11-08):**
- A slot is "taken" by any session that is **not Cancelled** (Proposed, Confirmed, Checked in, In
  therapy, Completed, No-show).
- Overlap counts the **duration**: 10:00 for 60 min clashes with 10:30. Back-to-back is fine
  (10:00–10:30, then 10:30).
- The **patient** side is checked too: one patient can't be with two therapists at once.
- No override. Fix it by changing the time, duration or therapist, or by cancelling the other session.

**Run against:** API **WP-59B** + this UI build. MGR or SYSADMIN login. Use test patients only.
Pick a free day (e.g. two weeks out) and two therapists who share a specialty (T1, T2), and two
test patients (A, B).

## 1. The same booking twice (the E2E repro)
1. Appointments → New booking: patient A, therapist T1, 10:00, 30 min → **Save**. Expect: saved.
2. New booking again with exactly the same values → **Save**.
- **Expect:** a red box titled **"This time is already taken"** with
  *"Therapist … already has a session on {date} from 10:00 to 10:30 (session #…). Choose another time or therapist."*
- The modal stays open and every field is still filled in. Change the time to **10:30** → the red box
  clears → **Save** works (back-to-back).

## 2. Overlap by duration
1. New booking: patient B, therapist T1, **09:30, 60 min** → Save.
- **Expect:** "already taken" (09:30–10:30 runs into A's 10:00 session).

## 3. Same patient, different therapist
1. New booking: patient A, therapist **T2**, 10:15, 30 min → Save.
- **Expect:** "already taken" with *"This patient already has a session on … from 10:00 to 10:30 with …"*.

## 4. Reassign therapist into a busy therapist
1. Book patient B with T2 at 10:00 (30 min) — saves (T2 is free).
2. Open that session → Actions → **Reassign therapist** → pick **T1** → Reassign.
- **Expect:** red box in the modal, "This time is already taken" + the message; therapist unchanged.

## 5. Cancelled sessions free the slot
1. Cancel A's 10:00 session with T1.
2. Book a **third** test patient (B is busy at 10:00 with T2 from §4) with T1 at 10:00 → **Expect:** saves.

## 6. Treatment-plan scheduling (patient clash)
1. For a test patient who already has a session at, say, Monday 10:00, schedule a treatment plan whose
   line is Monday 10:00.
- **Expect:** the wizard lists a conflict *"Patient already has a session from 10:00 to … on … (session #…)"*,
  with no alternative therapists offered, and nothing is booked until it's resolved.

## 7. Nothing else is blocked
- Editing the **discount** or **notes** of an existing session never shows this error, even on old
  imported sessions that happen to overlap.
- Check-in / Start / Complete on a normal (not cancelled) session never shows this error.

Clean up: cancel the test sessions created above.
