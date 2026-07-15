# WP-33 — Personalized Salutation: Owner Walkthrough

UI-only change to the header greeting (renders on every page, not just the dashboard).
No API deploy, no re-login required — name and roles already come from `/auth/me`.

## Scenario 1 — Front Desk user

1. Log in as an FD user (e.g. the front-desk account).
2. **Expect line 1:** "Good morning/afternoon/evening, **<FirstName>**" — first name only
   (no last name, no middle name), in the violet accent where "Front Desk" used to be.
3. **Expect line 2 (small gray text):** `Front Desk · <Weekday, Month D, YYYY>`.

## Scenario 2 — Multi-role user shows only the highest role

1. Log in as a user holding more than one role (e.g. MGR + FD).
2. **Expect:** the small line shows `Manager · <date>` — the higher role wins.
   Precedence: System Administrator > Owner > Manager > Assistant Manager > Accountant > Front Desk.

## Scenario 3 — System Administrator

1. Log in as the SA account.
2. **Expect:** `System Administrator · <date>` — regardless of any other roles held.

## Scenario 4 — Everywhere, and on mobile

1. Navigate Patients → Payments → Admin: the personalized greeting follows on every page.
2. Narrow the window to phone width: the role+date line **truncates with "…"** rather than
   wrapping the header taller (header stays two lines / same height).

## Notes

- Labels are the standard set (owner ruling 2026-07-15): Front Desk, Manager,
  Assistant Manager, Owner, Accountant, System Administrator.
- A role code the UI doesn't recognize shows as its raw code (never a blank line).
