# WP-56C Test Scenarios — UI magic-strings cleanup

**What changed:** the SPA's scattered status ids/names, relationship, gender, confirmation and
duration values now each come from one file under `src/constants/`. This is meant to be
**invisible** apart from **one intended change**: the caretaker **Relationship** dropdowns now
offer **Legal Guardian**. Everything below checks that nothing *else* moved.

**Run against:** the deployed stack after this UI build is live. UI-only — no API/DB change, no
re-login needed. The 40-minute booking option was already removed by the earlier hotfix
(`wp-56-booking-drop-40-min.md`).

## 1. Relationship dropdowns offer Legal Guardian (the intended change)

Check all three places a relationship is picked by hand:

1. **Caretakers** → open a caretaker → **Link patient**.
2. **Patients** → open a patient → Caretakers panel → **Add caretaker**.
3. A cross-add chain: from a patient's Add-caretaker flow choose **create new caretaker**
   (the relationship select inside the new-caretaker form).

- **Expect (each):** options are exactly **None, Father, Mother, Relative, Hired Help, Legal
  Guardian**. **Self is NOT offered** (it's only created by the "their own caretaker" button).
- Pick **Legal Guardian** and save → the link is created (no error), and the patient's caretaker
  list shows the relationship as Legal-Guardian.

## 2. Self links stay permanent

1. Open a patient who is their own caretaker (Self link).
   - **Expect:** no **Remove** button on the Self row (patient side) and no **Unlink** on the
     caretaker side — same as before.

## 3. Appointment statuses look and behave the same

1. **Appointments** page: the summary cards (Proposed / Confirmed / In Progress / Completed) show
   the same counts as before; every status badge keeps its colour.
2. Click each filter tab — **All, Proposed, Confirmed, Checked In, In Therapy, Completed,
   Cancelled**. **Cancelled** lists both cancelled **and** no-show sessions.
3. Open a **Proposed** session's Actions panel:
   - The **Confirm** section shows; Method options are **Phone, Email, Text, In Person**; Result
     buttons are **Confirmed, No Answer, Left Message, Declined**.
   - Choosing **Declined** on a session with an amount shows the amber "cancels this session and
     zeroes its money" note.
4. Open a **Completed / Cancelled / No Show** session: no status-change buttons and no cancel
   section (terminal), as before.
5. Row quick actions: Proposed → **Confirm**, Confirmed → **Check In**, Checked In → **Start**,
   In Therapy → **Complete**.

## 4. Dashboard tiles unchanged

1. Dashboard (home): **Pending payment / Paid off / Past due** never include cancelled or no-show
   sessions; the **Cancelled + No-Show** tile counts them.
2. Click that tile → lands on Appointments with the **Cancelled** tab active (URL `?filter=cancelled`).
3. In today's list, cancelled/no-show rows show a grey **Cancelled** or red **No Show** chip, not
   a payment chip.

## 5. Schedule, treatment plans, patients, admin

1. **Schedule** matrix: legend still reads Proposed, Confirmed, Cancelled, Completed, No Show,
   Checked In, In Therapy with the same colours.
2. **Treatment Plans**: tabs **All / Draft / Active / Completed / Cancelled** filter correctly;
   Draft plans show Edit/Schedule, Active plans show their progress card and booking actions.
   The progress list's session colours are unchanged (Proposed shows **blue** there — that's
   intentional, it has always differed from the amber badge).
3. **Patients** → New patient: Gender options **Male, Female, Other**.
4. **Booking**: Duration options **30, 45, 60, 90, 120** (default 60).
5. **Admin → Specialty prices**: the price grid still has the 30/45/60/90/120 columns.
6. **Admin → Users**: the role picker still hides Patient / Therapist / Caretaker.
