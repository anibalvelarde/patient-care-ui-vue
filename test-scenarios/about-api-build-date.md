# Test Scenarios — Admin › About: API build date (H2)

Punch-list H2 (2026-07-07 meeting): the Build Info panel showed UI version/SHA/build time but
no REST API build date. The panel now has four rows — **UI**, **UI built**, **API**,
**API built** — the last one read from the new `buildTimeUtc` field on
`GET /api/health/checks`.

> Pre-req: an API build that includes the H2 change (first build after PR merge, > v120).
> Against an older API the "API built" row legitimately shows "—" (scenario 3).

## 1. Happy path — all four rows populated

1. Log in and open **Admin → About** (Build Info panel).
2. Verify rows, in order:
   - **UI** — `v{n} ({sha})` (or `dev (…)` on a local dev build).
   - **UI built** — locale-formatted date/time (e.g. `7/11/2026, 1:24 PM`).
   - **API** — assembly version (e.g. `121.0.0.0`).
   - **API built** — locale-formatted date/time, plausibly matching the deploy day of the
     running API build.
3. Cross-check: `curl -s $API/api/health/checks | jq -r '.buildTimeUtc'` — the row should be
   that instant rendered in your local timezone.

## 2. API unreachable

1. Stop the API (or block the network) and reload Admin → About.
2. **API** shows *unavailable* (italic); **API built** shows **—**. UI rows unaffected.

## 3. Older API without the field (rollout window)

1. Point the UI at a deployed API build ≤ v120 (field absent from the JSON).
2. **API** shows its version normally; **API built** shows **—** (no error, no blank).

## 4. Loading state

1. On a slow connection (devtools throttling), while the health call is in flight both
   **API** and **API built** show `…`, then resolve together.

## Automated coverage

`app-ui/src/__tests__/about-panel.spec.ts` (5 specs): happy path, absent field, `"unknown"`
sentinel, fetch failure, UI rows intact. Suite 69 green; vue-tsc + eslint clean.
