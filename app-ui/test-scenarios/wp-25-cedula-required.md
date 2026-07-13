# WP-25 — Cedula | Passport Required (Punch-list F5)

Prereqs: API ≥ v128 deployed (WP-25B `[Required]` + clear-block). No DB step, no reseed, no
re-login. Any patient-editing role (FD is fine) unless noted. The field is free text — a cedula
**or** a passport number both count; uniqueness still applies.

## Create requires it

1. **Create without a value (any role)** — Patients › Add Patient: the field is now labeled
   **Cedula | Passport \*** with placeholder "Cedula or passport number". Fill everything else,
   leave it blank, Save → red banner "Please fill in all required fields.", no request sent.
   (API backstop: a client that posts anyway gets **400**.)
2. **Create with a value** — same form, enter a cedula or passport (stray spaces OK) → patient
   created; reopening Edit shows the trimmed value.

## Can't clear once on file

3. **Clear attempt blocked** — edit a patient who has a stored value: it hydrates into the
   field. Blank it out and Save → red banner "Cedula | Passport cannot be cleared.", no PUT is
   sent, the modal stays open. Re-enter the value (or Cancel) → stored value intact.
4. **Change is still allowed** — same patient: replace the value with a different one → saves;
   reopen to confirm the new value round-tripped.

## Legacy (no value on file) stays editable — amber nag

5. **Legacy nag** — edit a legacy-imported patient (cedula never captured, e.g. an L24-#### MRN):
   the field shows an **amber border** and the hint "No Cedula | Passport on file — capture it
   when available." Typing a value clears the amber immediately.
6. **Unrelated quick fix still works** — same legacy patient: correct the phone number only,
   leave Cedula | Passport blank, Save → succeeds (204; the payload omits the field, so the API
   treats it as unchanged). No 400, no nag-turned-blocker.
7. **Active toggle on a legacy patient** — from the All Patients grid, Deactivate/Activate a
   legacy NULL-cedula patient → still works (tolerant ruling: the toggle never demands a value).
8. **Organic backfill** — edit the legacy patient and enter their cedula/passport, Save → value
   stored; grid column now shows the green "On file" badge.

## Duplicate → 409

9. **Duplicate value** — create (or edit) a patient using a cedula/passport already on another
   patient → the API's **409** duplicate message surfaces in the red banner; nothing is saved.

## Relabel sweep

10. All Patients grid: desktop column header reads **Cedula | Passport** (still the "On file"
    badge / "—", never the raw ID; presence-sort unchanged); mobile card line reads
    "Cedula | Passport:". Admin › Merge Patients: preview cards' row reads **Cedula | Passport**;
    the patient pickers' placeholder reads "Search by name, MRN, or cedula/passport…" and result
    lines read "MRN … · Cedula|Passport …". Search still matches on the raw value.
