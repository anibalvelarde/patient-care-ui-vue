# WP-39C — Per-Duration Specialty Price Sheet: owner walkthrough

Each specialty now carries a per-duration price sheet (30/45/60/90/120 min) with effective
dates: entering a price **appends** a dated row (history is never rewritten), future-dated rows
schedule price changes, and already-booked sessions keep their price. Price editing is a new
narrow permission (**MGR + AM + SYSADMIN**); structural specialty edits — including the new
"Offered on-site" flag — stay SYSADMIN-only. Sites gain an **On-site trip charge** amount
(applied per on-site booking by WP-40; this WP only stores it).

> Booking behavior does **not** change in this WP — the booking form still pre-fills from
> Default $. WP-40 re-points booking at this sheet (and applies the trip charge).

**Prereqs:** DB **V030** applied, **RoleClaim reseed** run (`seed-role-claims.sql`, manifest
`57b6150a350c`), API **WP-39B** deployed, this UI (WP-39C) deployed. ⚠️ **Everyone must
re-login** — claims mint at login. Without re-login MGR/AM won't see Admin / the Prices action.

## Scenario 1 — MGR enters a price sheet for one specialty

1. Sign in as a **Manager** (re-logged-in after the reseed).
2. **Expected:** the left sidebar now shows the **Admin** (gear) entry — new for MGR.
3. Open **Admin**. **Expected:** Configuration (Sites) + all four Reference Data tables are
   listed; **no** Merge Patients / Security / Build Info (those stay SYSADMIN).
4. Open **Specialty Types**. **Expected:**
   - The table shows **Default $** and a new **On-site** column (Yes / —).
   - **No** "+ Add Specialty" button and **no** edit pencil (structural edits stay SYSADMIN).
   - Each row has a **"Prices…"** action.
5. Click **Prices…** on a specialty with no prices yet (fresh install: all of them).
   **Expected:** the modal shows all five durations with **—** as current price, a note that
   missing durations fall back to Default $ (or "no fallback" if none is set), and an amber
   **"No current 60-minute price"** warning (soft — nothing is blocked).
6. Enter the customer's sheet, e.g. 30 min = `25.00`, 45 min = `35.00`, 60 min = `45.00`,
   90 min = `65.00`, 120 min = `80.00`. Leave **Effective from** at today. Click
   **Save New Prices**.
7. Re-open **Prices…** on the same specialty. **Expected:** each duration now shows its price
   with "since {today}", and the 60-minute warning is **gone**.

## Scenario 2 — future-dated change + history

1. Still as MGR, open **Prices…** on the same specialty.
2. For 60 min, enter a new amount (e.g. `50.00`) and set **Effective from** to a date **next
   month**. Save.
3. Re-open the modal. **Expected:** the 60-min **current** price is still the old one (the new
   row isn't effective yet). Click **History** on the 60-min row: both rows are listed
   newest-first, with the effective one tagged **current**.
4. Try saving the **same duration + same date** again with any amount.
   **Expected:** a friendly error — *"A price for that duration and effective date already
   exists — pick a different date (history is never overwritten)."* Nothing is saved.

## Scenario 3 — AM: reaches exactly the Specialty Types section

1. Sign in as an **Assistant Manager** (re-logged-in).
2. **Expected:** the **Admin** entry appears (new for AM).
3. Open Admin. **Expected:** the page lands directly on **Specialty Types**, and the section
   list shows **only** Specialty Types — no Sites, no other reference tables, no Merge
   Patients/Security/Build Info.
4. **Expected:** in the table there is a **Prices…** action but no Add/Edit controls.
5. Open **Prices…** and append a price row (any duration, today). **Expected:** saves fine —
   AM holds the same price-edit permission as MGR.

## Scenario 4 — FD: nothing new

1. Sign in as a **Front Desk** user.
2. **Expected:** **no Admin entry** in the sidebar (FD has no Admin.View). Navigating to
   `/admin` by URL bounces to the dashboard.
3. Book a session as usual. **Expected:** booking is completely unchanged (Amount still
   pre-fills from Default $ — WP-40 will switch it to the sheet).

## Scenario 5 — SYSADMIN: on-site flag + Site trip charge

1. Sign in as the **System Admin**.
2. **Admin → Specialty Types → edit** (pencil) a specialty that can be done at the customer's
   home. **Expected:** the form now has an **"Offered on-site (customer home/facility)"**
   checkbox (SYSADMIN-only — MGR/AM never see this form). Check it, save.
   **Expected:** the table's **On-site** column shows **Yes** for that row.
3. **Admin → Sites → edit** the site. **Expected:** a new field **"On-site trip charge ($,
   applied per on-site visit)"**, default `0`. Set e.g. `10.00`, save, re-open: value sticks.
   A negative value is rejected with an inline error.
4. Note: the flag and the charge do nothing to bookings **yet** — WP-40 adds the on-site
   checkbox at booking (only for eligible specialties) and attaches the charge.

## Scenario 6 — lookup table sorting (owner follow-up)

1. As any user who can see a Reference Data table (MGR is fine), open e.g.
   **Admin → Payment Types** (applies to all four tables).
2. **Expected:** rows arrive sorted by **Sort Order** ascending (ties ordered by name,
   case-insensitive), and the **Sort Order** header shows a **▲** marker.
3. Click the **Name** header. **Expected:** rows re-sort alphabetically by name (▲ moves to
   Name). Click **Name** again: order reverses (▼).
4. Click the **Sort Order** header. **Expected:** back to the default Sort Order ascending
   view (▲ on Sort Order). Other headers (Abbreviation, Description) are not clickable.
5. No reload happens on any click — sorting is instant/client-side.

## Cleanup

None needed — prices entered here are the real production sheet. If you entered test rows on a
real specialty, append a corrected row effective today (history is append-only by design; a
stray row with a past date is superseded by any newer row).
