# WP-30 — Server Paging for Patients & Caretakers Lists (U2) — User-Facing Test Scenarios

⚠ **DEPLOY TOGETHER with API `feature/wp-30b-list-paging`** — `GET /api/patients` and
`GET /api/caretakers` now return the `PagedResult` envelope (breaking pair). Run these
scenarios only against a deployment that has BOTH sides.

What changed for users:
- The Patients and Caretakers lists load **30 rows per page** (Page X of Y + Prev/Next),
  ordered by name, instead of the entire census in one call.
- The search box now searches **server-side** (patients: name / MRN / cedula-passport;
  caretakers: name / email) and the Active/Inactive tabs filter server-side too.
- Every dropdown that used to list every patient/caretaker (booking, payments, linking,
  merge, statements, cross-add chain) is now a **type-to-search picker** — type at least
  1 character, results appear after a moment, capped at 20, ordered by name.

## Setup

- Log in as **MGR**.
- The clinic dataset (~869 patients / ~1,089 caretakers) makes paging obvious — any dataset
  with more than 30 of each works.

## 1. Page through the patients list

1. Open **Patients**. **Expect** at most 30 rows, a count like "869 patients", and a footer
   "Page 1 of 29" with **Prev disabled**.
2. Click **Next ▶** twice, then **◀ Prev** once. **Expect** the rows change each time, the
   footer tracks "Page 2 of 29" → "Page 3 of 29" → "Page 2 of 29", and the page loads fast.
3. On the last page, **expect Next disabled**.
4. Column-header sorting reorders **the current page only** (the census itself is ordered by
   name server-side) — this is by design.

## 2. Search by MRN (and name, and cedula)

1. In the Patients search box type a known MRN (e.g. `L26-0921`). **Expect** after a brief
   pause the list narrows to that patient and the count/pager update (e.g. "1 patient",
   "Page 1 of 1") — no page reload, no full-list flash.
2. Clear the search. **Expect** the full paged list returns to page 1.
3. Repeat with a partial last name and with a cedula/passport fragment — both match.
4. Mobile check (narrow window): the card layout still renders with the same pager.

## 3. Active / Inactive tabs are server filters now

1. Click the **Inactive** tab. **Expect** only inactive patients, with the count showing the
   inactive total (not the all-patients total) and the pager reset to page 1.
2. Click **Active**, then **All**. **Expect** counts and pages to re-query each time.
3. Type a search term while on **Inactive**. **Expect** the results are inactive matches only.
4. Repeat 1–2 on **Caretakers** — same tab behavior.
5. **Delinquent** and **Session History** tabs behave exactly as before (unchanged this WP).

## 4. Book a session via the patient typeahead

1. Appointments → Book Appointment. **Expect** the Patient field is a search box
   ("Search patient by name, MRN, or cedula…"), not a giant dropdown.
2. Type 2–3 letters of a patient's name. **Expect** up to 20 suggestions (name + MRN) after a
   brief pause; typing an MRN fragment also matches.
3. Pick one. **Expect** a selected card with an ✕ to clear; the WP-23 caretaker hard-block and
   the discovery-first banner still react to the picked patient exactly as before.
4. Complete the booking as usual. **Expect** it saves normally.
5. From a context that pre-selects the patient (e.g. Treatment Plans → book), **expect** the
   picker arrives already showing the patient's card.

## 5. Record a payment via the caretaker typeahead

1. Payments → Record Payment. **Expect** the Caretaker field is a type-to-search picker
   (name or email).
2. Pick a caretaker, fill amount/type, go to step 2. **Expect** unpaid sessions load for that
   caretaker as before.
3. **Edit** an existing payment. **Expect** the caretaker card is pre-filled from the payment
   and its allocations are intact.
4. From Patients → Delinquent → Pay: **expect** the caretaker arrives pre-selected.

## 6. WP-27 cross-add chain still works

1. Patients → Add Patient → save. In the chooser click **Link an existing caretaker**.
   **Expect** the caretaker field is a typeahead; search, pick, set relationship, Link.
   **Expect** the success dialog "…is now bookable".
2. Caretakers → Add Caretaker → save → **Link an existing patient** — same flow mirrored
   (patient results show MRN under the name).
3. The "Create a new …" chain arms are unchanged.

## 7. Linking panels exclude already-linked records

1. Patients → View Caretakers (a patient with a caretaker) → Add Caretaker. **Expect** the
   typeahead; searching for the already-linked caretaker does **not** offer them again.
2. Caretakers → View Patients → Link Patient — same, with linked patients excluded.

## 8. Caretaker statement picker

1. Statements → Caretaker tab. **Expect** a caretaker typeahead instead of the full dropdown.
2. Search, pick, Generate Statement. **Expect** the statement renders as before.
   (The Therapist tab keeps its small full-roster dropdown — unchanged by design.)

## 9. Admin merge pickers (SYSADMIN)

1. Admin → Merge Patients. **Expect** Survivor and Duplicate are typeaheads (name/MRN/cedula).
2. Pick a survivor; **expect** the duplicate picker won't offer that same record.
3. Preview → the rich identity cards still show MRN/cedula/DOB/counts (they come from the
   preview call, not the picker). Merge flow unchanged.

## 10. Typeahead edge behaviors (any picker)

1. Focus a picker without typing. **Expect** a "Type to search…" hint — no results, no request.
2. Type a nonsense string. **Expect** `No matches for "…"`.
3. A very common letter (e.g. `a`) returns at most **20** rows — type more to narrow.
