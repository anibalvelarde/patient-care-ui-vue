# WP-31C (U1) — Audit Info Popover: owner walkthrough

A small ⓘ button on each Patient row, Caretaker row, and the Session Details panel reveals a
record's history: **Created**, **Last updated**, and **Last updated by**. It's read-only and
shows for anyone who can see the row.

> "Last updated by" is best-effort: it shows the operator's name when we can attribute the change,
> or **"System"** for legacy-imported records and background scripts (the database only stores who
> last *updated* a row — there's no "created by").

**Prereqs:** API **WP-31B** deployed (so the responses carry the `audit` block) and this UI
deployed. Additive — an older API just means the ⓘ doesn't appear (no error).

## Scenario 1 — Patients

1. Go to **Patients**. Each row (desktop) and card (mobile) has a small ⓘ in the actions area.
2. **Tap/click** the ⓘ. A little card appears: Created · Last updated · Last updated by.
3. On desktop, **hovering** the ⓘ for a moment also opens it.
4. Click the ⓘ again, press **Esc**, or click **anywhere outside** — it closes.
5. Edit a patient (change the phone), save, reopen the ⓘ → **Last updated** is now, **Last updated
   by** is your name.

## Scenario 2 — a legacy patient shows "System"

1. Search a legacy-imported patient (MRN like `L24-####` / `L25-####`) that hasn't been edited in-app.
2. Open its ⓘ → **Last updated by: System** (imported by a script, not a person).

## Scenario 3 — Caretakers

1. Go to **Caretakers**. Same ⓘ on each row/card; open it to see the history.

## Scenario 4 — Session Details

1. Open **Appointments**, click a session to open the **Session Details** panel.
2. The ⓘ sits in the panel header (next to the ✕). Open it to see the session's created/updated/by.

## Scenario 5 — nothing leaks, nothing breaks

1. The card never shows a raw user id — only a name or "System".
2. The popover opens above the fold near the bottom of the screen (it flips up so it isn't clipped).

## Notes

- No new permission — if you can see the row, you can see its history (no re-login needed).
- Front-desk, managers, accountants, owners all see it on the pages they already have.
