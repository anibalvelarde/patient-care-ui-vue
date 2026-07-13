# WP-27 — Cross-Add Flows (F8 + F9) — User-Facing Test Scenarios

Owner ruling 2026-07-13: **Option A — sequential hand-off** in both directions.
No API/DB changes; both directions link through `POST /api/caretakers/{id}/patients`.

## Setup

- Log in as **MGR** (or AM/FD — all hold `Caretakers.LinkPatient`, `Caretakers.Edit`, `Patients.Edit`).
- Have at least one existing caretaker and one existing patient in the system.

## F8 — New patient → caretaker chain

### 1. End-to-end: new patient → create caretaker → immediately bookable (the arc F10 used to block)
1. Patients → Add Patient → fill all required fields (incl. Cedula | Passport) → Save Patient.
2. **Expect** the modal closes and a chooser dialog appears: "Patient created — {name}" with the
   amber nudge *"This patient has no caretaker on file — bookings are blocked until one is linked."*
3. Click **Create a new caretaker**. **Expect** the Add Caretaker slide-over opens with an amber
   banner "Will be linked to patient {name}", plus **Relationship to {name}** dropdown and a
   **Primary caretaker** checkbox (pre-checked).
4. Fill the caretaker fields, pick Relationship = Mother, Save Caretaker.
5. **Expect** a success dialog: "{caretaker} created and linked as primary — {patient} is now bookable."
6. Go to Appointments → book a session for the new patient. **Expect** the caretaker-less booking
   guard does NOT block (patient has a primary caretaker). The discovery-first rule still applies
   as usual (default: discovery required).

### 2. Link an existing caretaker instead
1. Add Patient → Save. In the chooser click **Link an existing caretaker**.
2. **Expect** a slide-over "Link Caretaker" with the amber "Linking to patient {name}" banner,
   a caretaker dropdown, Relationship dropdown, and Primary checkbox (pre-checked).
3. Pick a caretaker + relationship → Link. **Expect** the success dialog; the patient's caretaker
   panel (Patients → View Caretakers) now lists the caretaker with the Primary badge.

### 3. "Later" escape hatch
1. Add Patient → Save. In the chooser click **Later**.
2. **Expect** the dialog closes with no other prompt. The patient has no caretaker; attempting to
   book them still hard-blocks with the caretaker-required message (F10 guard unchanged).

## F9 — New caretaker → patient chain

### 4. Create a caretaker, then create its patient in the chain
1. Caretakers → Add Caretaker → fill fields → Save Caretaker.
2. **Expect** the chooser: "Caretaker created — {name}" with the blue nudge about linking a patient.
3. Click **Create a new patient**. **Expect** the FULL Add Patient slide-over (Cedula | Passport
   required, "Requires discovery session" checkbox — WP-25/24 behavior intact) plus the amber
   "Will be linked to caretaker {name}" banner and relationship/primary fields.
4. Save. **Expect** success dialog "…created and linked as primary". The caretaker's patient list
   (Caretakers → View Patients) shows the new patient.

### 5. Link an existing patient
1. Add Caretaker → Save → chooser → **Link an existing patient** → pick patient + relationship →
   Link. **Expect** success; the link appears in both panels.

## Claim gating

### 6. Read-only roles see no chain
1. Log in as **OWN** (read-only oversight) — OWN cannot create patients/caretakers, so the chain
   never triggers for it. (Component-level: an OWN user shown the chooser would see only "Later";
   covered by unit test.)
2. As MGR/AM/FD, verify the chain's Link/Create buttons appear (all three roles hold the claims).

## Failure handling (non-atomic create-then-link)

### 7. Link fails after create
1. Simulate a link failure (e.g., stop the API between the caretaker save and the link, or link a
   pair that is already linked via a second browser tab to force a 400).
2. **Expect** a card: "{Caretaker} was created, but linking failed" with **Retry link** and
   **Link manually later**. Retry after restoring the API completes the link; "Link manually
   later" closes the chain — the created record exists and can be linked from its panel.

## Regression checks

### 8. Existing link panels still work (now on the shared form)
1. Patients → View Caretakers → Add Caretaker: dropdown + relationship + primary → Add works;
   Cancel closes the form. Same for Caretakers → View Patients → Link Patient.
2. The panel's link/remove buttons now gate on `Caretakers.LinkPatient` (the claim the API
   actually enforces) — MGR/AM/FD see no behavior change.

### 9. Edit flows unaffected
1. Editing an existing patient or caretaker and saving does NOT open the chain (create-only).
2. Temp-MRN banner still appears when creating a patient with a blank MRN (chain and banner
   coexist — banner top-right, chooser centered).
