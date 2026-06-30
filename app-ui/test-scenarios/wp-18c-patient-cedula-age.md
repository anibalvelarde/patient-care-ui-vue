# WP-18C — Patient Cedula + derived Age (UI test scenarios)

Adds an optional **Cedula** (government ID) field to the patient record and a display-only **Age
(yy mm)** derived from Date of Birth. Age is never stored or sent to the API — the UI computes it.

## Setup
- Sign in as a user with `Patients.Edit` (e.g. MGR/AM/FD) so Add/Edit are available.
- Navigate to **Patients**.

## Scenarios

### 1. Create a patient with a Cedula
1. Click **Add Patient**.
2. Fill required fields; in **Cedula**, enter `001-1234567-8`.
3. Note the **Age** line appears under Date of Birth as you pick a DoB (e.g. "Age: 26 yrs 5 mos").
4. Save.
5. **Expect:** patient appears in the table with the Cedula shown in the **Cedula** column; the DOB cell
   shows the derived age beneath the date.

### 2. Create a patient with no Cedula (optional)
1. **Add Patient**, leave **Cedula** blank, fill the rest, save.
2. **Expect:** saves successfully; Cedula column is blank (mobile card shows "—"). No error.

### 3. Duplicate Cedula is rejected
1. **Add Patient** with a Cedula already used by another patient.
2. **Expect:** save fails with a friendly error: **"A patient with this Cedula already exists."**
   (HTTP 409 from the API.) No patient is created.

### 4. Edit an existing patient's Cedula
1. Edit a patient, change **Cedula** to a new unique value, save.
2. **Expect:** the new Cedula shows in the table and persists after a refresh.

### 5. Age updates live with Date of Birth
1. Open Add or Edit; change the **Date of Birth** field.
2. **Expect:** the **Age** line recomputes immediately ("Y yrs M mos"). Clearing/blank or a future DoB
   shows no age line.

### 6. Deactivate / reactivate does not drop the Cedula
1. From the table actions, **Deactivate** then **Activate** a patient that has a Cedula.
2. **Expect:** the Cedula is unchanged after the toggle (not erased).

### 7. Search by Cedula
1. In the patient search box, type part of a patient's Cedula.
2. **Expect:** the list filters to matching patient(s) — Cedula is searchable alongside name/MRN/email/phone.

### 8. Age display in the list
1. Review the **DOB** column (desktop) and the DOB line (mobile card).
2. **Expect:** each patient with a valid DoB shows the derived age; a patient with no/blank DoB shows the
   date only (no age).

## Notes
- **Age boundaries:** exact birthday → "N yrs 0 mos"; the month borrows correctly when the day-of-month
  hasn't been reached yet this month. Verified by `src/__tests__/age.spec.ts`.
- Age is timezone-stable (parses the `yyyy-MM-dd` prefix directly), so it doesn't shift by a day for
  users west of UTC.
