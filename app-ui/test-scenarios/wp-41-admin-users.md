# WP-41C Test Scenarios — Admin → Users + Sticky Sidebar (P1)

User-facing walkthrough for admin user management (SA-only v1) and the sticky-sidebar fix.
Run against the deployed stack **after** the WP-41B API deploy. No matrix change, no reseed,
no re-login (hash `f82cab8c9efd` unchanged) — the claims have existed since WP-17.

## 1. SYSADMIN — full CRUD

1. Log in as the **SYSADMIN** account → Admin. The left accordion now has a **Security**
   group with a **Users** entry (the "Coming Soon" placeholder is gone). Open it.
2. The table lists **operator accounts only** (staff sign-ins) — patients/caretakers who
   only exist as identities do NOT appear. Columns: Name, Email (login), Roles (violet
   chips + a muted "also: Patient/…" hint where the operator is also an identity),
   Active badge, Password ("Must change" when a temp password is pending).
3. **Search**: type part of a name or email — the table re-queries the server after a
   ~300ms pause and restarts at page 1. Clear it; if there are >25 operators, Prev/Next
   page through and the footer shows "Page x of y · N users".
4. **Create**: Add Operator → fill First/Last/Email, a temp password (min 8 chars — try 7
   and confirm the inline message), tick at least one role. The role list offers **only
   operator roles** — Patient/Therapist/Caretaker never appear as options. Save:
   green banner "Operator account created for {email}… must change the temporary password
   at next login", and the new row shows **Must change**.
5. **Duplicate email**: create again with the same email → clean message
   "A user with this email address already exists." (no stack trace, modal stays open).
6. **Edit**: Edit a test account → add/remove roles, toggle Active → Save. The row updates.
   Untick ALL roles and Save → the API's message about keeping at least one operator role
   appears verbatim (deactivate instead of stripping roles — by design).

## 2. Guard rails — try to break yourself

All as the logged-in SYSADMIN, editing **your own** account:

1. Untick **Active** → Save → "You cannot deactivate your own account."
2. Untick **SystemAdmin** from your roles → Save →
   "You cannot remove the SystemAdmin role from your own account."
3. If only one active SYSADMIN exists, any change that would strip it →
   "This change would leave the system with no active SystemAdmin account."
   These are hard blocks — confirm nothing changed after each attempt.

## 3. Reset password + forced change at next login (G3)

1. As SYSADMIN: Reset password on a test operator → enter a temp password twice
   (mismatch and <8 chars are both blocked client-side) → confirm.
2. Green banner: temp password set, must change it at next login. Row shows **Must change**.
3. Log out; log in as that operator **with the temp password** → the app forces the
   Change Password screen before anything else. Change it → normal app. The **Must change**
   indicator clears from the admin table.

## 4. MGR / OWN — read-only

1. Log in as **Manager** (or Owner) → Admin → Security → Users is visible.
2. The table renders with the note "Read-only: changes require a System Administrator" —
   **no** Add Operator button, **no** Edit / Reset password actions on any row.
3. Log in as **Front Desk** → Admin is absent from the sidebar entirely (unchanged), and
   even a direct /admin URL never shows a Users/Security entry.

## 5. Sticky sidebar (P1) + mobile check

1. On desktop, open a long page (Patients with a full page of rows, or Session History)
   and scroll to the bottom: the violet left sidebar **stays pinned** — the Admin gear at
   its bottom remains visible the whole time instead of sinking below the fold.
2. On a short-height window (e.g. ~600px tall), the sidebar itself scrolls independently
   if its items don't fit — the page content doesn't jump.
3. **Mobile** (narrow the window below tablet width): the left sidebar disappears as
   before and the top mobile nav takes over — no layout regression, no horizontal scroll.

## 6. Rollout tolerance (older API)

If the UI ships before the WP-41B API: opening Admin → Users shows the red error panel
("An unexpected error occurred while fetching data." — the endpoint 404s with an empty
body, so the HttpClientBase fallback message shows) with a "Try again" button — no blank
screen, no crash. The rest of the Admin page keeps working.
