# WP-50 — Adult self-caretaker — Test Scenarios

**Feature:** an adult patient who is **their own caretaker**, recorded as a single `SystemUser`
holding both a Patient and a Caretaker row, in one click, from the front desk.

**What shipped**
- **WP-50A (DB, already in prod):** `Self` added to `PatientCaretaker.RelationshipToPatient`.
- **WP-50B (API):** `POST /api/caretakers/self { patientId, isPrimary }` — attaches a Caretaker role
  to the patient's **existing** SystemUser (no new user, no email) and self-links
  (`RelationshipToPatient = "Self"`, primary). Idempotent (409 if already their own caretaker).
  Policy: `Caretakers.LinkPatient`.
- **WP-50C (UI):** a third **"This patient is their own caretaker"** button in the cross-add chooser
  that opens right after a patient is created; **email is now optional** on the Add/Edit Patient and
  Caretaker forms.

**Roles that can do this:** MGR, AM, FD (they hold `Caretakers.LinkPatient`), plus SYSADMIN.

---

## Setup (local test stack)

The local stack points at a MySQL loaded from the **2026-08-22 production backup** (a faithful
replica — Juliana 922/1135 and Daniel 436/1133 are already self-linked; Susana **Saiz** is absent).

| Tier | URL / detail |
|------|--------------|
| UI   | http://localhost:8080 |
| API  | http://localhost:5245 |
| DB   | MySQL 8.0.46 in Docker (`nc-wp50-mysql`), host `127.0.0.1:3399`, db `neurocorp` |

Log in with an operator account you know the password for, e.g. **`anibalvelarde+MGR@gmail.com`**
(MGR) or **`anibalvelarde+tester@gmail.com`** (FD). To watch a role get gated out (TC-6), an
Owner/Accounting account works (read-only for these actions).

---

## UI scenarios

### TC-1 — Happy path: create an adult patient, then make them their own caretaker  ⭐ acceptance
1. Log in as MGR or FD. Go to **Patients → Add Patient**.
2. Fill first/last name, date of birth (an adult DOB), gender, **Cedula|Passport**, phone.
   **Leave Email blank** (this is now allowed — see TC-4).
3. Save. The **cross-add chooser** pops up ("Patient created — …", "bookings are blocked until a
   caretaker is linked").
4. Click **"This patient is their own caretaker"** (the green button).
5. **Expect:** a success panel — *"{name} is now their own caretaker"* / *"{name} is now bookable."*
6. Open the patient's detail / Caretakers list. **Expect:** exactly **one** caretaker, relationship
   **Self**, marked **primary**, same person — and **no second login account** was created.
7. (Optional) Try to **book a session** for the patient → it is no longer blocked for lack of a
   caretaker.

> Use a fictional name for this run (e.g. the real **Susana Saiz** acceptance case, or any test
> name) — it becomes a permanent record in the local DB copy.

### TC-2 — The button only appears in the patient→caretaker direction
1. Go to **Caretakers → Add Caretaker**, save a new caretaker.
2. The mirror chooser opens ("Caretaker created — link a patient").
3. **Expect:** there is **no** "their own caretaker" button here (a caretaker is not their own
   *patient* — the mirror direction is intentionally out of scope for now).

### TC-3 — Idempotency: can't do it twice
1. Take a patient who is **already** their own caretaker (TC-1's patient, or Juliana / Daniel from
   the seed data via a direct API call — see TC-A2).
2. Attempt the self-caretaker action again (re-open the chooser from the patient page if offered).
3. **Expect:** a friendly error surfaced on the chooser — *"…is already their own caretaker"* — and
   **no** duplicate caretaker row / link is created. The success panel does **not** show.

### TC-4 — Email is now optional (root-cause fix)
1. **Add Patient** with **no email** → Save succeeds (previously blocked with "fill in all required
   fields").
2. **Add Caretaker** with **no email** → Save succeeds.
3. Edit an existing patient, clear the email, save → succeeds; the stored email becomes empty/NULL.
4. **Expect:** no "email required" validation anywhere; the `*` is gone from the Email labels.

### TC-5 — Existing cross-add paths still work (regression)
1. Add a patient → in the chooser, use **"Link an existing caretaker"** (pick a parent, relationship
   Mother/Father) → links as before.
2. Add a patient → **"Create a new caretaker"** → creates + links as before.
3. **Expect:** WP-27 behavior unchanged; only the new third button is additive.

### TC-6 — Access gating
1. Log in as **Owner (OWN)** or **Accounting (ACCT)** (roles without `Caretakers.LinkPatient`).
2. Create/observe the chooser.
3. **Expect:** the **"This patient is their own caretaker"** button is **not shown** (same gate as
   "Link an existing caretaker").

---

## API scenarios (curl)

Get a token first (login as an operator you have the password for):

```bash
# returns a JWT; copy it into TOKEN
curl -s -X POST http://localhost:5245/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"anibalvelarde+MGR@gmail.com","password":"<your password>"}'
TOKEN=<paste-jwt>
```

### TC-A1 — Make a fresh patient their own caretaker → 201
```bash
# 1) create a patient (no email) and note the returned patientId
curl -s -X POST http://localhost:5245/api/patients \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"firstName":"Susana","lastName":"Saiz","dateOfBirth":"1990-05-01T00:00:00","gender":"Female","cedula":"TEST-SAIZ-1","phoneNumber":"555-0100"}'

# 2) make them their own caretaker (use the patientId from step 1)
curl -s -i -X POST http://localhost:5245/api/caretakers/self \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"patientId":<PID>,"isPrimary":true}'
```
**Expect:** `201 Created` with a `CaretakerProfile` whose `userId` equals the patient's user.
Then `GET /api/patients/<PID>/caretakers` shows one caretaker, `relationshipToPatient:"Self"`.

### TC-A2 — Idempotency → 409
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5245/api/caretakers/self \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"patientId":922,"isPrimary":true}'   # Juliana — already self-linked in the seed
```
**Expect:** `409` (already their own caretaker).

### TC-A3 — Unknown patient → 404
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5245/api/caretakers/self \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"patientId":999999,"isPrimary":true}'
```
**Expect:** `404`.

### TC-A4 — No new SystemUser is minted
Before/after TC-A1 step 2, run:
```sql
SELECT COUNT(*) FROM SystemUser;
```
**Expect:** the count is **unchanged** by the self-caretaker call (a caretaker **role** is added to
the patient's existing user; no second account).

---

## What to confirm overall
- One human = **one** SystemUser, holding both roles; **no** second/`+alias` account.
- The self-link is a single row, `RelationshipToPatient = "Self"`, primary — **no reverse row**.
- Patients/caretakers can be saved **without an email**.
- The action is gated to MGR/AM/FD/SYSADMIN and is idempotent.
