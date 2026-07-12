# WP-24 — Requires Discovery Waiver (F3 create-time waiver · F4 legacy unblock)

Prereqs: API ≥ v127 deployed with V028 + RoleClaim reseed (hash `7ae3aa5e3274`) applied; the F4
legacy backfill run (owner-go'd) for legacy-patient scenarios. Log in per scenario role.

## F3 — Waiver at create

1. **Create with waiver (FD)** — Patients › Add Patient: the new **Requires discovery session**
   checkbox is **checked by default**. Uncheck it → hint appears: "This patient is exempt from
   the discovery-first rule — treatment sessions can be booked without a completed discovery
   session." Save. Booking for this patient immediately offers the **full** specialty list (no
   amber discovery banner).
2. **Create untouched (any role)** — add a patient without touching the checkbox: the patient is
   created with discovery required (book for them → amber banner + discovery-only specialties).

## F3/F4 — Edit gate

3. **Edit gate (FD)** — edit any existing patient as FD: the **Requires discovery session**
   checkbox is **greyed out (disabled)** with the hint "Only Managers / Assistant Managers can
   change this after creation." Saving other edits (name/phone/etc.) still works — the flag is
   simply not sent, so no 403.
4. **Edit gate (MGR/AM)** — same modal as MGR or AM: checkbox enabled; flip it and save →
   persists (reopen to confirm). API backstop: a client that forces a flag change without
   `Patients.RequiresDiscovery.Edit` gets **403** and nothing else in the update applies.

## F4 — Legacy (waived) patient books treatment

5. **Legacy end-to-end** — pick a backfilled legacy patient (L24/L25/L26 MRN,
   `requiresDiscovery = false`, no discovery session on file) in Appointments › Book
   Appointment: **no** amber "needs a discovery session" banner, the specialty dropdown shows
   **all** specialties and the therapist list is unfiltered. Book a normal treatment session
   (e.g. TL) → **201 created**, no "requires a completed discovery" 400.

## Discovery-first still holds for everyone else

6. **Unwaived new patient** — select a fresh patient (flag checked, no completed discovery):
   the amber banner "This patient needs a discovery session first." shows and only discovery
   specialties (Obs-/Eval-/Vis-) and discovery-qualified therapists are offered.
7. **FD books a discovery session** — as FD, book that discovery specialty session → succeeds
   (201). FD now *holds* `Patients.StartDiscovery` and the API enforces it (audit F1 closed);
   a token without the claim gets 403 on discovery-specialty creates.

## Regression sweep

8. Patient with a **completed** discovery session: no banner regardless of the flag; full
   specialty list.
9. SENADIS checkbox behavior (WP-23) unchanged — both checkboxes gate independently on edit.
10. Older-API tolerance: if the profile response lacks `requiresDiscovery`, the UI treats it as
    true (banner still shows for undiscovered patients; edit modal shows the box checked).
