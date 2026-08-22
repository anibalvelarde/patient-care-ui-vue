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

### TC-3 — Idempotency (the UI naturally prevents a repeat)
The "This patient is their own caretaker" button only appears in the **post-create chooser** for a
patient who has **no caretaker yet**. Once they are their own caretaker they *have* a caretaker, so
the chooser/button is no longer offered — there is **no UI path to do it twice**. That's the intended
behaviour (confirmed in testing).
1. **Expect (UI):** after TC-1, there is no way to re-trigger the self-caretaker action for that
   patient — so no error is needed or shown.
2. The idempotency **guard still exists at the API** as a safety net (a second `POST /api/caretakers/self`
   returns **409**) — exercised by **TC-A2**, not through the UI.

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

### TC-7 — A `Self` link is permanent (no removal)  ← added from testing feedback
1. Open a self-caretaker patient's **detail page → Caretakers panel**. **Expect:** the row shows
   relationship **Self**, and there is **no "Remove"** button on it (a normal caretaker row still has one).
2. Open that same person's **Caretaker detail → Patients list**. **Expect:** the self row shows
   **Self** and has **no "Unlink"** button (a normal patient row still has one).
3. (API) A direct `DELETE /api/caretakers/{caretakerId}/patients/{patientId}` against the self link
   returns **409** ("A self-caretaker link cannot be removed.").

> **Why permanent:** removing the self link would strand the caretaker identity minted on the
> patient's own account and let a duplicate be created on a re-add. Correcting a genuine mis-tick is a
> deliberate DB action, not an in-app one.

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


## Test Results:
- when testing for [TC-3], I was not able to see the record for "self" in the search results.  The original behavior is taking care of the recursiveness.  I did not get to see a UI "friendly error" like the `TC-3` description indicated.

## Observations:
- ~~when adding a Caretaker and choosing to link existing patients, I think that any patients that have a `self` relationship are not elegible to appear on the search results.  Agree?~~
  - This observation was a mistake. This behavior does not occur in the current application.
- I noticed that the `self` relationship can be "removed" from either the patient or the caretaker's perspective.  Should that removal action be allowed?  I'm in the camp of "no removals" for `self` type relationships. Thoughts?
  - **Resolved (2026-08-22): agreed — no removals for `self`, hard-blocked for everyone.** It was
    also a real gap, not just a preference: unlinking a self link left an orphaned caretaker identity
    and let a *duplicate* be minted on a re-add. Fix shipped on the WP-50 branches — the API `DELETE`
    returns **409** for a `Self` link, and the Remove/Unlink button is hidden on both the patient and
    caretaker views. See **TC-7**.