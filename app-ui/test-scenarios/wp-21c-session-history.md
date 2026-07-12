# WP-21C — Patient Session History tab (F1)

Feature: Patients page gains a **Session History** tab (right of Delinquent) showing a
server-paged patient list (30/page, most-recent-session first, searchable) where expanding a
patient reveals their paged session table (25/page, newest first). Rows are read-only and link to
the Dashboard view of the session. Requires the WP-21B API (deploy → v123) — against an older API
the tab shows the standard error state with a retry.

## Scenario 1 — Tab visibility per role
1. Sign in as MGR (or AM / OWN / SYSADMIN).
   VERIFY: Patients page shows tabs All / Active / Inactive / Delinquent / **Session History**.
2. Sign in as FD.
   VERIFY: **Session History is visible** even though Delinquent is hidden.
3. Sign in as an ACCT user (once one exists).
   VERIFY: Session History visible; Delinquent hidden.

## Scenario 2 — Patient list: recency ordering + paging
1. Open Patients → Session History.
   VERIFY: patients are listed most-recent-session first; each row shows name, MRN, Last Session
   date, and a Total Sessions badge; the footer reads "Page 1 of N · X patients" with **Prev
   disabled**.
2. Click **Next ▶**.
   VERIFY: page 2 loads (different patients), footer updates; **◀ Prev** now enabled. On the last
   page, Next is disabled.
3. A patient who has never had a session (create one fresh) appears on the **last** page with
   "—" for Last Session and a 0 badge.

## Scenario 3 — Server-side search
1. In the shared "Search patients..." box, type part of a patient's first name, last name, or MRN
   (e.g. "benn" or "l25-").
   VERIFY: after a brief pause (~300 ms) the list reloads from **page 1** showing only matches —
   including matches that were NOT on the currently displayed page (this proves the search is
   server-side).
2. Clear the search.
   VERIFY: the full list returns, page 1.

## Scenario 4 — Expand a patient → paged sessions
1. Click a patient row with many sessions (a legacy patient — some have 100+).
   VERIFY: the row expands inline; sessions show Date | Specialty | Therapist | Amount |
   Discount | Paid, **newest first**, max 25 rows, with its own "Page 1 of N · X sessions" footer.
2. Click **Next ▶** inside the expansion.
   VERIFY: the next 25 sessions load; the outer patient list does not move.
3. Paid column: a fully-paid session shows a green ✓ with the paid amount; an unpaid one shows
   the amount paid in amber (hover shows the amount still due).
4. As FD or MGR: Amount / Discount / Paid values are visible (owner ruling — FD may see money
   columns). ProviderAmount is never shown anywhere on this tab.

## Scenario 5 — Row → Dashboard → go back
1. In an expanded patient, click a session row.
   VERIFY: the Dashboard opens on that session's date with the session highlighted, and an amber
   "**Back to Patient Session History**" banner appears at the top.
2. Click the banner.
   VERIFY: you land back on Patients with the **Session History tab active** (deep link
   `?tab=sessions`).
3. Repeat from the Delinquent tab.
   VERIFY: its banner still reads "Back to Patient Delinquent Review" (labels didn't collide).

## Scenario 6 — Deep link
1. Navigate directly to `/patients?tab=sessions`.
   VERIFY: the Session History tab is pre-selected and loaded.
