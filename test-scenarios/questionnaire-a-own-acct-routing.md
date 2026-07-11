# Test Scenarios — Questionnaire A: OWN / ACCT roles (manifest 776a7665d67b)

The UI vendors the new manifest (OWN=24 / ACCT=14 grants) and the router guard now resolves
a per-user **landing route** (first allowed page, in sidebar order) instead of hard-coding the
dashboard — ACCT is the first operator role without `Dashboard.View`, which previously would
have been **signed out at login** as "no-access", or redirect-looped.

> Pre-req: a SystemUser holding the OWN or ACCT role (RoleType rows exist since 2026-07-11;
> user assignment is still SQL-only until the Admin user-mgmt WP).

## 1. ACCT login lands on Patients

1. Log in as an ACCT-role user.
2. You are **not** rejected; you land on **/patients** (ACCT's first allowed page).
3. Sidebar shows only: Patients, Therapists, Caretakers, Payments, Statements, Service
   Payments. No Dashboard, Appointments, Treatment Plans, Schedule, or Admin.

## 2. ACCT deep-links to a denied page

1. As ACCT, navigate directly to `/` or `/appointments`.
2. You are redirected to `/patients` — no blank screen, no logout, no redirect loop.

## 3. ACCT capabilities inside pages

1. Payments: sees list; can **Adjust**; cannot Record or Split (buttons hidden).
2. Service Payments: sees all tabs; can **issue** (Pay Therapist / Run Payroll) and
   **reverse** payments.
3. Statements: both tabs (Caretaker + Therapist) visible.
4. Caretakers: can create/edit caretakers; cannot link/unlink patients.

## 4. OWN login is read-only oversight

1. Log in as an OWN-role user → lands on **/** (dashboard, incl. the ProviderAmount column
   and both money tiles).
2. Every page opens: Patients (incl. Delinquent tab), Therapists (incl. Delinquent),
   Caretakers, Payments, Statements (both tabs), Service Payments, Appointments, Treatment
   Plans, Schedule.
3. **No write controls anywhere**: no create/edit buttons, no payment recording, no booking,
   no payroll issue/reverse.
4. `/admin` — still SysAdmin-only in the UI (17C follow-up); OWN's `Admin.View` claim is
   seeded but the route stays gated for now.

## 5. Existing roles unaffected

1. MGR / AM / FD logins behave exactly as before (landing = dashboard; same pages/buttons).
2. A claimless user (e.g. caretaker-only) is still signed out at login with the
   "no-access" message.

## Automated coverage

`src/__tests__/router-guard.spec.ts` (4 new, red→green): ACCT not signed out, ACCT
dashboard→patients redirect, ACCT denied-page→landing redirect, OWN reaches dashboard.
Suite 73 green; vue-tsc + eslint clean.
