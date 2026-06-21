# WP-14.5 — "Pending therapist payments" dashboard tile — User Test Scenarios

Adds a stat tile to the dashboard stats bar (`/`) showing the clinic-wide **gross amount still owed
to therapists** for completed sessions (all-time outstanding), with a "{n} therapists owed" subtitle.
Payout-derived, so it follows the Service Payments confidentiality rule: **MGR/AM see it, FD does not.**

Prereqs: API + UI on `feature/wp-145-pending-summary` (or merged), RoleClaim seed applied, re-login so
the JWT carries `ServicePayments.View`.

## 1. Tile is visible to MGR/AM
1. Sign in as **MGR** (or **AM**) → land on the dashboard (`/`).
**Expect:** a fifth tile **"Pending Therapist Pay"** appears in the stats bar with a sky-blue
money icon, a large currency value (gross still owed), and a subtitle like **"4 therapists owed"**.
The stats bar lays out as 5 tiles across on large screens (2-up on small).

## 2. Value matches Run Payroll
1. Note the tile's amount. Go to **Payroll → Run Payroll**, set From to a very early date and To to
   today, **Preview Payroll**.
**Expect:** the grand total owed in the preview equals the dashboard tile amount (the tile is all-time
by default, so a wide preview window should match), and the therapist count matches the subtitle.

## 3. Zero state
1. On a clinic where everything is paid off, the tile reads **$0.00** with **"0 therapists owed"** and
   a neutral (grey) border. (When money is owed the border is sky-blue.)

## 4. FD is excluded
1. Sign in as **FrontDesk**.
**Expect:** the dashboard shows only the original four tiles — **no** "Pending Therapist Pay" tile.
The summary is never fetched for FD (they lack `ServicePayments.View`; the API would 403).

## 5. Resilience
1. If the summary endpoint is unavailable, the tile is simply omitted (the other four tiles render
   normally) — no error banner, no broken layout.

## 6. Thousands separator (formatCurrency)
1. Anywhere a currency figure shows (the tile, the dashboard financial summary, payments), large
   amounts now group with commas: **$28,470.50**, **$1,050,433.50** (not `$28470.50`). Small amounts
   still read `$7.10`, `$0.00`.

## 7. Therapists › Pending Pay tab (read-only drill-down) — MGR/AM
This is the per-therapist decomposition of the dashboard tile (NOT the Delinquent tab, which is
patient-billing/AR — a different ledger).
1. Sign in as **MGR/AM** → **Therapists** → a **Pending Pay** tab appears (sky-blue) next to Delinquent.
2. Click it → a table with one row per therapist owed money: **Therapist · Sessions · Session Dates
   (first–last) · Patients (distinct) · Clinic Made (gross billed, pre-discount) · Owed · % Owed**,
   plus a totals footer.
**Expect:** the footer **Owed** total equals the dashboard "Pending Therapist Pay" tile amount, and the
row count equals the tile's "{n} therapists owed".
3. Search filters rows by therapist name; the totals footer recomputes to the visible rows.

## 8. Pending Pay tab — FD excluded
1. Sign in as **FrontDesk** → **Therapists** → there is **no** Pending Pay tab (gated
   `ServicePayments.View`); the report is never fetched.
