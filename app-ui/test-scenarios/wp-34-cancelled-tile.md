# WP-34C — Dashboard Tile: Cancelled / No-Show — Owner Walkthrough

**What changed:**
1. A new always-on dashboard stat tile, **"Cancelled / No-Show"**: headline number = today's
   Cancelled + No-Show appointments combined; small subtitle shows the split
   ("3 cancelled · 1 no-show"). Visible to **everyone** with dashboard access (it is a count,
   not money — no claim gating).
2. The stat-bar grid was reworked to a wrap-friendly layout: any number of tiles (FD's 5,
   MGR/AM's 7, or more in the future) wraps cleanly instead of relying on a fixed
   6/5/4-column ladder.
3. Clicking the tile jumps to **Appointments** with the existing **Cancelled** filter tab
   pre-selected (shows today's Cancelled + No-Show rows).

No API or DB change; no permission/matrix change; no re-login needed.

---

## Scenario 1 — Day with several cancelled/no-show (any role)

Pick (or set up) a day that has a mix: e.g. 3 sessions Cancelled, 1 marked No-Show, plus some
Completed/Confirmed ones. (To stage one: Appointments → row actions → Cancel on a few,
No-Show on one.)

1. Open the dashboard (Home) for that day.
2. **Expect:** a "Cancelled / No-Show" tile with a gray "ban" icon.
   - Headline number = **4** (3 cancelled + 1 no-show).
   - Subtitle underneath reads **"3 cancelled · 1 no-show"**.
3. Cross-check: the headline must equal the count of rows on the Appointments view's
   Cancelled tab for the same day.
4. The other tiles are unchanged: Today's Appointments still counts ALL sessions (including
   cancelled ones), Paid Off / Pending Payment / Past Due behave as before.

## Scenario 2 — Clean day (0 cancelled)

1. Navigate the dashboard calendar to a day with no cancelled/no-show sessions.
2. **Expect:** the tile stays visible and shows **0**, subtitle "0 cancelled · 0 no-show" —
   same behavior as the other always-on tiles (they show 0 rather than hide).

## Scenario 3 — Tile click-through

1. On a day with cancellations, click the "Cancelled / No-Show" tile.
2. **Expect:** you land on **Appointments** with the **Cancelled** filter tab already
   selected, listing today's Cancelled and No-Show rows (both statuses share that tab —
   this is the pre-existing tab, unchanged).
3. Click the "All" tab — the full list appears as usual.

## Scenario 4 — Role perspectives (grid spacing)

**As Front Desk (FD):**
1. Open the dashboard. **Expect 5 tiles:** Today's Appointments, Paid Off, Pending Payment,
   Past Due, Cancelled / No-Show. The two money tiles (Pending Therapist Pay, Pending
   Caretaker Pay) are absent as before.
2. Tiles are evenly sized with no oversized gaps or a lonely stretched tile.

**As Manager or Admin (MGR/AM):**
1. Open the dashboard. **Expect 7 tiles:** the 5 above plus Pending Therapist Pay and
   Pending Caretaker Pay (still linked to their tabs).
2. On a typical desktop width the 7 tiles wrap onto a second row cleanly (e.g. 4+3 or 5+2
   depending on window width) — no squashed tiles, no horizontal scrollbar.

## Scenario 5 — Desktop and mobile widths

1. Desktop (roughly 1280px+): tiles lay out in a single row or wrap once; resize the browser
   narrower and watch tiles re-wrap smoothly with equal widths.
2. Mobile / narrow window (under ~1024px): tiles show **2 per row** as before, for both FD
   (5 tiles → 2+2+1) and MGR/AM (7 tiles → 2+2+2+1).
3. The "Cancelled / No-Show" label may wrap to two lines in a tight tile — that is expected;
   nothing should be cut off.

## Scenario 6 — Count keys on status, not money

1. Cancel a session that already has money recorded (or one past due).
2. **Expect:** it counts in the Cancelled / No-Show tile regardless of its payment state,
   and it still ALSO appears wherever its money state puts it (e.g. Past Due) — the tile is
   status-only and deliberately money-agnostic (the cancelled-money cleanup is a separate,
   pending work package).
