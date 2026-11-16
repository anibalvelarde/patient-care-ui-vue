# WP-62 — Contact & caretaker rules — test scenarios

**What changed:**
- **Email on edit:** clearing a patient's or caretaker's email now really clears it. Spaces around
  an email are trimmed, and an address that doesn't look like an email is refused.
- **Primary caretaker:** a patient always keeps **at least one** primary caretaker (several are
  fine, e.g. two parents who each pay). Staff can now change who is primary without unlinking.
- **"This patient is their own caretaker"** now works for adult patients who are already on file,
  not only right after creating them.

**Needs:**
- API branch `fix/wp-62b-contact-caretaker-rules`
- UI branch `fix/wp-62c-contact-caretaker-rules`
- No database migration.

**Setup:** log in as Front Desk, a Manager or SYSADMIN. Use test patients and caretakers.

## Part 1 — Email

### 1. Clearing an email
1. Patients → open a patient that has an email → **Edit**. Delete the email and save.
2. Re-open **Edit**.
- ✅ The email is empty. Before this fix the old address came back.
3. Do the same on a caretaker (Caretakers → **Edit**).
- ✅ The email is empty.

### 2. Spaces are trimmed
1. Edit a patient. Type `  Someone@Example.test  ` (with spaces before and after) and save.
- ✅ The saved email is `Someone@Example.test`, with the capital letters kept.
2. Clear the email on two different caretakers, one after the other.
- ✅ Both save. Before, the second one failed with "A user with this email address already exists".

### 3. Bad addresses are refused
1. Add a new caretaker with the email `not-an-email`.
- ✅ The save is refused with "Email address is not valid."
2. Edit a patient and change the email to `not-an-email`.
- ✅ Same message, and nothing is saved.
3. If an old record already has a bad email, edit only its phone number and save.
- ✅ The save works. The old email is only checked when you change it.

## Part 2 — Primary caretaker

### 4. The only primary is protected
1. Open a patient with two caretakers, one of them primary → **Caretakers**.
- ✅ The primary caretaker's **Remove primary** and **Remove** buttons are greyed out. A note says:
  "The only primary caretaker can't be removed — make another caretaker primary first."
- ✅ The other caretaker has **Make primary** and an active **Remove**.

### 5. Moving the primary
1. Click **Make primary** on the second caretaker.
- ✅ Both now show the blue **Primary** badge, and both **Remove primary** buttons are active.
2. Click **Remove primary** on the first caretaker.
- ✅ Only the second caretaker is primary, and its buttons are now the greyed-out ones.

### 6. A patient with no primary
1. Find a patient whose caretakers include no primary (the census script, db #71, lists them).
   Open **Caretakers**.
- ✅ An amber banner says "This patient has no primary caretaker".
2. Click **Make primary** on one caretaker.
- ✅ The banner goes away.

### 7. Adding a caretaker
1. For a patient with **no** primary, click **Add Caretaker**.
- ✅ **Primary caretaker** starts checked.
2. For a patient that already **has** a primary, click **Add Caretaker**.
- ✅ The box starts unchecked. Leave it unchecked and add.
- ✅ The patient now has a primary plus one more caretaker.
3. On a patient with no caretakers at all, add one and leave Primary unchecked.
- ✅ It's saved as **Primary** anyway: the first caretaker is always primary.

### 8. From the caretaker's side
1. Caretakers → a caretaker → their patients. Try to unlink a patient for whom this caretaker is
   the only primary.
- ✅ The removal is refused with "Make another caretaker primary first".

## Part 3 — Their own caretaker

### 9. Existing adult patient
1. Open an adult patient who is not their own caretaker → **Caretakers**.
- ✅ The button **This patient is their own caretaker** is shown.
2. Click it.
- ✅ A confirmation appears with a **Primary caretaker** box. The box is checked when the patient has
  no primary yet, unchecked otherwise.
3. Click **Confirm**.
- ✅ The patient appears in their own list with the relationship **Self**, with no **Remove**
  button (Self links are permanent), and the button disappears.
- ✅ "Self" is still not offered in any relationship drop-down.

### 10. Who sees what
- ✅ The Make / Remove primary buttons and the "their own caretaker" button need the same permission as
  linking caretakers. Accounting sees the list read-only.
