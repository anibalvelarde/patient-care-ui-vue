# Quick-Fix Test Scenarios — Dashboard Cancelled/No-Show Classification (WP-42C cherry-pick)

Fixes the owner-reported 2026-07-28 symptom: a (zeroed) cancelled session showed as
**"Pending"** in Dashboard → Appointments and counted **1 in "Pending Payment"** while also
counting 1 in "Cancelled". UI-only; no API change, no permission change, nobody re-logs-in.

## 1. The reported case

1. Open the Dashboard on a date whose only session is a cancelled one (e.g. the
   July 13 or July 29 test cancellations).
2. **Cards:** "Pending Payment" shows **0**; "Cancelled / No-Show" shows **1**;
   "Today's Appointments" still counts it (known, deliberate — separate ruling).
3. **Appointments panel row:** the session shows a **"Cancelled"** chip (slate pill, same
   palette as the appointment status badges) — no gray "Pending" chip, and its color bar is
   muted slate instead of violet.

## 2. Mixed day

1. Pick a date with live sessions + a cancelled one.
2. "Pending Payment" counts ONLY the live unpaid sessions; "Paid Off" only live paid ones.
3. Live rows keep their normal chips (Pay / Paid / Past Due / Pending); only the
   cancelled/no-show rows show state chips.

## 3. Safety behavior (legacy money on a cancelled row)

Until WP-42 ships its write-side zeroing, a session cancelled TODAY still keeps its money.
Cancel a test session and check the dashboard: the row shows **"Cancelled"** with **no Pay
button** (previously it showed an active Pay button inviting collection on a cancelled
appointment) and it does not count in Pending Payment / Past Due cards.

## 4. No-show

Mark a test session No-Show: row chip reads **"No Show"** (red pill); counts in the
Cancelled/No-Show card only.

**Suite:** `npx vue-tsc --noEmit && npm run lint && npx vitest run` → **313 passed**
(baseline 307 + 6 in `wp42-dashboard-cancelled-classification.spec.ts`).
