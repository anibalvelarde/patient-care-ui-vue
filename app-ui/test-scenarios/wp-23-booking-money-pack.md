# WP-23 — Booking Money Pack (F6 default pricing · F7 SENADIS · F10 caretaker guard)

Prereqs: API > v125 deployed with V026/V027 + RoleClaim reseed applied; log in per scenario role.

## F6 — Specialty default price

1. **Set a price (SYSADMIN)** — Admin › Reference Data › Specialty Types: the table shows a new
   **Default $** column. Edit "TL — Language Therapy", a **Default $ (session price)** field
   appears in the modal; enter `65` and save. The row shows 65. Other lookup sections
   (Payment Types, Roles, Appointment Statuses) show **no** Default $ column or field.
2. **Booking pre-fill (any booking role)** — Appointments › Book Appointment: pick any patient,
   then specialty TL → **Amount auto-fills 65**. Switch to a specialty with no default → the
   amount you last had stays (no wipe). Switch back to TL → refills 65. Manually type a
   different amount after selecting → it sticks (pre-fill only fires on specialty change).

## F7 — SENADIS discount

3. **Flag at create (FD)** — Patients › Add Patient: the **SENADIS discount (statutory 20%)**
   checkbox is enabled; create a patient with it checked.
4. **Edit gate (FD)** — edit any existing patient as FD: the checkbox is **disabled** with the
   hint "Only Managers / Assistant Managers can change the SENADIS flag." Saving other edits
   still works (the flag is simply not sent).
5. **Edit gate (MGR/AM)** — same modal as MGR or AM: checkbox enabled; toggling + saving
   persists (reopen to confirm).
6. **Floor at booking** — book for a flagged patient: on selecting the patient a toast appears —
   "SENADIS: statutory 20% discount applied — it cannot be reduced." Set Amount 100 → the
   Discount clamps up to 20.00 and shows "SENADIS: min 20.00 (20%)". Type a discount of 30 →
   kept (more is allowed). Type 5 and submit → the created session still carries discount
   20.00 (submit + server both clamp). Unflagged patients see no toast and keep any discount.
7. **Floor in the plan wizard** — Treatment Plans › Schedule for a flagged patient: each line's
   Discount initializes to 20% of the line amount (60 min ⇒ $13.00 of $65.00) with a
   "SENADIS: min $13.00 (20%)" hint; entering less gets raised back at submit.

## F10 — Caretaker hard block

8. **Booking modal** — pick a patient with no caretakers: the amber warning is now a **red
   blocker** — "Booking blocked — this patient has no caretaker on file. Link a caretaker
   first." — and the Book button stays disabled no matter what else is filled.
9. **Plan wizard** — open Schedule Sessions for a caretaker-less patient: step 1 shows the red
   "Scheduling blocked" banner and **Next** is disabled even with date + site chosen.
10. **API backstop** — any client bypassing the UI gets `400 — "A caretaker must be linked to
    this patient before booking."` on both create paths. Synthetic `-SH (LEGACY)` caretakers
    satisfy the rule (they are real links).

## Regression sweep

11. Booking an unflagged patient with a caretaker: unchanged behavior end-to-end.
12. Admin lookup CRUD on non-specialty tables: unchanged (4 columns, 4 fields).
13. FD full-profile round-trip edits (name/phone/etc.) on flagged patients save without 403.
