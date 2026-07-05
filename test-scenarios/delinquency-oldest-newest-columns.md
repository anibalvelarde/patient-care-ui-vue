# Test Scenarios — Oldest/Newest columns on the Delinquent tabs

Feature: both delinquency tables (Patients → Delinquent, Therapists → Delinquent)
show two new columns, **Oldest** and **Newest** — the earliest and latest session
dates among that row's **past-due** sessions (matches the "Past-Due Sessions"
count; unpaid-but-not-yet-past-due sessions do not stretch the range).

## Scenario 1 — Multi-session range (desktop)
1. Log in as MGR/AM/FD; go to **Patients → Delinquent** tab.
2. Pick a row whose Past-Due Sessions count is ≥ 2 and expand it.
3. VERIFY: the **Oldest** cell equals the earliest date in the expanded list's
   past-due rows, **Newest** the latest, both formatted MM/DD/YYYY.

## Scenario 2 — Single-session row
1. Find a row with Past-Due Sessions = 1.
2. VERIFY: Oldest and Newest show the same date.

## Scenario 3 — Range excludes not-yet-past-due sessions
1. Find (or create) a patient with an old unpaid session AND a session from the
   last few days (inside the 35-day grace window). The recent one appears in the
   expanded list but is not counted in the Past-Due badge.
2. VERIFY: **Newest** shows the newest *past-due* date, not the recent session's.

## Scenario 4 — Therapists tab parity
1. Go to **Therapists → Delinquent**.
2. Repeat Scenarios 1–2. VERIFY identical behavior and formatting.

## Scenario 5 — Mobile cards
1. Narrow the window below the md breakpoint (or use a phone).
2. VERIFY each delinquency card shows an "Oldest: … · Newest: …" line under the
   Total Due / Paid / Balance row, on both tabs.

## Scenario 6 — Layout regression
1. On both tabs (desktop): expand a row and click a session line.
2. VERIFY the session link still opens the dashboard at that date with the
   session highlighted, detail lines span the full table width (no orphan
   columns), and the "No delinquent … found." empty state (search for gibberish)
   still spans the whole table.
