# Patient Management Feature

## Overview

Wires the "Patients" navbar link in the Clean Medical dashboard (Option 01) to a full Patient Management page. The REST API already supports CRUD operations (`GET/POST/PUT /api/patients`); this feature adds the UI layer.

## What Was Done

### New Files Created

| File | Purpose |
|------|---------|
| `src/interfaces/Patient.ts` | TypeScript interfaces: `Patient`, `PatientCreateRequest`, `PatientUpdateRequest` |
| `src/services/PatientsHttpClient.ts` | HTTP client extending `HttpClientBase` with `getPatients`, `getPatient`, `createPatient`, `updatePatient` |
| `src/views/PatientsView.vue` | Page-level view — same shell as Option01View (O1Navbar + O1Footer) |
| `src/components/patients/PatientList.vue` | Search bar, filter tabs (All/Active/Inactive), patient count, composes PatientTable |
| `src/components/patients/PatientTable.vue` | Sortable table (desktop) with card layout (mobile), status badges, edit/toggle actions |
| `src/components/patients/PatientFormModal.vue` | Slide-over panel for Create and Edit — shared component with validation |

### Files Modified

| File | Change |
|------|--------|
| `src/services/HttpClientBase.ts` | Added `post<T>()` and `put()` methods alongside existing `get<T>()` |
| `src/router/index.ts` | Added `/patients` route pointing to `PatientsView.vue` |
| `src/components/option01/O1Navbar.vue` | Converted `<a href="#">` to `<router-link>`, dynamic active state via `useRoute()`, Dashboard → `/`, Patients → `/patients` |

## UI Design Details

- **Style**: Clean Medical (Option 01) — matches existing Tailwind palette
- **Patient List**: Search input + "Add Patient" button, filter pills (All/Active/Inactive), patient count badge
- **Table columns**: Name, MRN, DOB, Gender, Email, Phone, Status, Actions
- **Status pills**: Active = `bg-green-100 text-green-700` / Inactive = `bg-slate-100 text-slate-500`
- **Actions**: Edit (pencil icon), Toggle active/inactive (circle icon)
- **Form modal**: Slide-over from right with fields: First Name*, Middle Name, Last Name*, DOB*, Email*, Phone*, Gender* (dropdown), MRN (create only), Active Status toggle (edit only)
- **Responsive**: Table collapses to card layout on mobile (`md:hidden` / `hidden md:block`)

## Name Parsing

API returns `patientName` as "LastName, FirstName MiddleName". The form modal and toggle-active action parse this:
```
const [last, rest] = patientName.split(', ');
const [first, ...middleParts] = (rest || '').split(' ');
```

## API Endpoints Used

- `GET /api/patients` — list all patients
- `GET /api/patients/{id}` — get single patient
- `POST /api/patients` — create patient (body: `PatientCreateRequest`)
- `PUT /api/patients/{id}` — update patient (body: `PatientUpdateRequest`)

## Verification Checklist

- [x] `npx vue-tsc --noEmit` — type-check passes
- [x] `npm run dev` — dev server starts, navigate to `/patients`
- [x] Patient list loads from API
- [x] "Add Patient" opens form modal, submit creates via POST
- [x] Edit button opens pre-populated form, submit updates via PUT
- [x] Toggle active/inactive sends PUT with flipped `activeStatus`
- [ ] Search filters client-side by name, MRN, email, phone
- [ ] Active/Inactive/All tabs filter correctly
- [ ] Navbar "Patients" link highlighted, "Dashboard" navigates to `/`
- [ ] Mobile responsive — table becomes cards on small screens

## Where We Left Off (2026-03-12)

**Status**: Patient CRUD is working end-to-end (list, add, edit verified manually).

**Next up: Caretaker Management**

Requirements captured:
1. When adding/editing a patient, user should be able to associate a caretaker (select from list)
2. If caretaker isn't in the list, "create new" flow is needed inline
3. Patient CAN be saved without a caretaker (optional at creation)
4. Patient CANNOT post new therapy sessions unless a caretaker is defined

**Before starting caretaker work:**
- Discover what caretaker API endpoints exist in `patient-care-api`
- Determine how patient-caretaker association is stored (field on patient? separate table?)
- Plan the UI: caretaker picker in PatientFormModal + standalone Caretakers page + session-booking guard
