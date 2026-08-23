# WP-54C — Change Log (Admin) — test scenarios

SYSADMIN-only. Admin › **Security › Change Log**. Field NAMES only — the screen never shows a
before/after value. Prereq: V035 applied, the matrix cycle deployed, and WP-54B (API) running.

## Visibility
1. Log in as **SYSADMIN** → Admin → the **Security** group shows a **Change Log** entry. Open it.
2. Log in as **MGR / AM / FD / OWN / ACCT** → Admin → **no Change Log entry** (it is SYSADMIN-only).

## Summary (single pane of glass)
3. On open it defaults to **Today** (caption reads *"your local time · <your timezone>"*). The pane
   leads with **Activity by user** (tagged *LEAD VIEW*), then **Activity by record type**, then a
   **Trend** strip. KPI tiles across the top: Total · Inserts · Updates · Deletes · Active users.
4. Make some changes elsewhere in the app (edit a patient's phone, book + move a session, waive a
   fee), come back, hit **Today** again → the tiles and lists move.
5. Switch the **date range** (Yesterday / Last 7 days / Last 30 days / Custom) — everything re-scopes.
   Custom shows two date pickers; the range is inclusive of both dates, in *your* local time.
6. Switch the **Trend** period (Day / Week / Month / Quarter / Year) → the bar strip re-buckets. A
   very wide window at Day granularity shows *"too many buckets"* instead of a chart.

## Drill-down (detail)
7. Click a **user row** in *Activity by user* → the detail list below filters to that user (a *User*
   filter chip appears; *Clear filters* resets). Click a **record-type row** → filters by that type.
8. In the detail table each row shows **time (your tz) · user · action badge** (Insert = green,
   Update = amber, Delete = rose) · **record type + label + #id** · **which fields changed**.
9. Expand an **Update** row (chevron) → it lists the **field names only**, with the note
   *"Before/after values are not recorded…"*. **Confirm no old/new value appears anywhere** — e.g. a
   phone-number edit shows `Phone`, never the number.
10. Insert rows read *"New record · n fields set"*; Delete rows *"Record removed · n fields"*.
11. Paging: **Prev / Next** and *"Page X of Y · N changes"* work as on other admin lists.
12. The *"same request"* chip on a row filters the list to everything that one request touched.

## Filters
13. Use the **User** typeahead (includes a **System** option for imports / id 0), the **Record type**
    chips (All + each audited type), and the **Action** chips (All / Insert / Update / Delete).
    *Clear filters* removes them all.

## Print
14. Click **Print / Save as PDF** → the browser print dialog opens; the printed page shows the summary
    with a footer *"Generated <time> · <timezone> … records which fields changed, not their values."*

## Not present (by design)
15. There is **no purge / delete-history control anywhere** on this screen — retention is an API-only
    SYSADMIN operation.

## Automated coverage
`src/__tests__/wp54-change-log.spec.ts` (8): nav gating (SYSADMIN vs MGR), summary+list load, by-user
drill-down re-query, period-group re-query, expand shows field names, print calls `window.print`,
error banner. Full UI gate: `vue-tsc` + lint + 417 vitest tests green.
