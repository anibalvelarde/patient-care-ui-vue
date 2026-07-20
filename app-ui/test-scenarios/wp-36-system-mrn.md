# WP-36C — System-Managed MRN (`NC{yy}-####`): owner walkthrough

MRNs are now **minted by the system**, never typed by staff. Creating a patient always assigns
the next `NC{yy}-####` for the current (Panama) year — e.g. the first app-created patient is
**`NC26-0001`**, the next `NC26-0002`, and the sequence **resets each calendar year** (first
patient of Jan-2027 → `NC27-0001`). The old "leave MRN blank ⇒ TEMP- ⇒ patient inactive until a
permanent MRN" dance is fully retired: **patients are active the moment they're created**. The
edit-modal MRN stays editable exactly as before (B2 — for correcting legacy `L2x-####` values;
a duplicate still gets the 409 message).

**Prereqs:** API **WP-36B** deployed, this UI (WP-36C) deployed. No DB migration, no RoleClaim
reseed, **no re-login needed**. Any patient-creating role works (FD is the natural one).

## Scenario 1 — create two patients back-to-back: sequential MRNs, no MRN field

1. Sign in as **Front Desk**. Patients → **Add Patient**.
2. **Expected:** the form has **no MRN input** anymore. Where it used to be there is only a
   read-only note: *"MRN assigned automatically on save."* (The old "leave blank for a
   temporary MRN…" hint is gone.)
3. Fill the required fields (name, DOB, Cedula | Passport, email, phone, gender) and save.
4. **Expected:** a **green "Patient Created" banner** appears top-right showing the minted MRN
   (e.g. **`NC26-0001`** on a fresh year) — read the chart number straight off the screen.
   The WP-27 "link a caretaker now?" chain offer still appears as before.
5. Immediately create a **second** patient (different cedula/email).
6. **Expected:** the banner shows the **next sequential** MRN (e.g. `NC26-0002`). Both patients
   appear in the list with their `NC26-####` MRNs.

## Scenario 2 — both patients are ACTIVE immediately

1. Stay on the Patients list; find the two patients from Scenario 1 (Active tab or search).
2. **Expected:** both show the green **Active** badge right away — no "inactive until a
   permanent MRN" state, no amber temporary-MRN badge anywhere in the table.
3. **Expected:** the Activate/Deactivate action is enabled normally for both (no
   "assign a permanent MRN first" lockout — that rule is gone with the TEMP flow).

## Scenario 3 — edit-modal MRN correction still works (B2), duplicate → 409

1. As **MGR** (or FD), edit any legacy patient with an `L2x-####` MRN.
2. **Expected:** the MRN field is still there and **editable**, with the familiar hint
   *"Changing the MRN must keep it unique; leave blank to keep the current one."*
3. Change the MRN to a value **already used by another patient** (e.g. the `NC26-0001` minted
   in Scenario 1) and save.
4. **Expected:** red banner — *"A patient with this Medical Record Number already exists."*
   (the 409). Nothing is saved.
5. Change it instead to a **unique** corrected value and save. **Expected:** saves fine and the
   list shows the corrected MRN.

## Scenario 4 — typed MRNs are ignored (deploy-gap tolerance, API-side)

Nothing to do in this UI — the field no longer exists. For completeness: if an old cached UI
(or any API client) still sends a `medicalRecordNumber` on create, the server **ignores it**
and mints anyway; the response carries the minted value.

## Ops note for staff (tell the front desk)

**Stop hand-minting `L2x-####` MRNs for new patients.** The system now mints every new
patient's MRN (`NC{yy}-####`) automatically at save — the `L{yy}-####` series belongs to the
legacy Excel imports only (`promote.py` keeps using it, unchanged). A hand-typed L-number can
no longer be entered at create at all, and hand-minting them anywhere else just risks
colliding with a future import. Corrections to *existing* legacy MRNs still go through the
edit modal as before.
