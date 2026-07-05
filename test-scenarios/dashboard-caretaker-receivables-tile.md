# Test Scenarios — "Pending Caretaker Pay" dashboard tile

Feature: a sixth dashboard tile showing the clinic-wide **past-due** amount that
caretakers/patients still owe (sum of the Delinquent tab's Balance column),
hyperlinked to Patients → Delinquent. Rose accent, `hand-holding-dollar` icon,
subtitle "N patients past due". Visible to MGR/AM only (rides
`Patients.Delinquent.View`, same pattern as Pending Therapist Pay).

## Scenario 1 — Tile value matches the tab (MGR or AM)
1. Log in as MGR; open the dashboard (`/`).
2. Note the "Pending Caretaker Pay" amount and its "N patients past due" subtitle.
3. Click the tile → VERIFY it lands on **Patients → Delinquent**.
4. Sum the **Balance** column (or spot-check totals) and count the rows.
5. VERIFY: tile amount = sum of Balance; N = number of delinquent rows.

## Scenario 2 — Row layout (desktop, MGR/AM)
1. On a large screen, VERIFY the tile row shows **6 evenly-sized tiles** in one
   line: Today's Appointments, Paid Off, Pending Payment, Past Due, Pending
   Therapist Pay (sky), Pending Caretaker Pay (rose, last).
2. VERIFY no tile text is clipped; long amounts truncate gracefully.

## Scenario 3 — FD sees no money tiles
1. Log in as FD (front desk); open the dashboard.
2. VERIFY: only the 4 count tiles appear (no Pending Therapist Pay, no Pending
   Caretaker Pay), spread across the full row width as before.

## Scenario 4 — Mobile layout
1. As MGR on a phone-width viewport: VERIFY the 6 tiles stack 2 per row
   (3 rows), all readable, the rose tile tappable and navigating to the
   Delinquent tab.
2. As FD on mobile: VERIFY 4 tiles in 2 rows, unchanged from before.

## Scenario 5 — Payment recorded updates the tile
1. As MGR, record a payment fully covering one delinquent patient's balance
   (Delinquent tab → Record Payment).
2. Return to the dashboard (reload).
3. VERIFY the tile amount dropped by that balance and the patient count fell
   by one; if no delinquents remain, the tile shows $0.00 with a neutral border.

## Scenario 6 — API failure degrades silently
1. With the API's `/api/patients/pastdue` unreachable (or a token lacking the
   claim), VERIFY the dashboard renders without the rose tile and without
   console-visible layout breakage (5 or 4 tiles, row still balanced).
