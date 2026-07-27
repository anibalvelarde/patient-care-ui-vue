# WP-40C Test Scenarios — Booking Auto-Money (BK-1/BK-2/BK-3)

User-facing walkthrough for the auto-money booking flow. Run against the deployed stack
**after** the WP-40 deploy (API first, then UI; RoleClaim reseed + re-login done — matrix
hash `f82cab8c9efd`).

## 1. FD books touching ZERO money fields (BK-1 + BK-2)

1. Log in as **Front Desk** → Appointments → Book Appointment.
2. **Duration is now a dropdown**: exactly 30 / 40 / 45 / 60 / 90 / 120 (default 60) — no
   free typing.
3. Pick a non-SENADIS patient, a specialty with a price row (e.g. TC), a therapist, 60 min.
   - **Amount** shows as a read-only derived figure (the price-sheet row for TC @ 60) —
     there is no amount input anywhere.
   - **Discount** shows **$0.00**, read-only.
   - FD sees **no Provider Amt** at all (claim-gated).
4. Change duration 60 → 30: the Amount display re-derives to the 30-min price instantly.
5. Book. Open the session — Amount/Discount match what the form previewed (the server
   derived them authoritatively).

## 2. SENADIS + non-SENADIS patient (exact-20% rule)

1. Book for a patient with **active SENADIS** (unexpired): Discount shows exactly
   **20% of the derived Amount** with the badge **"SENADIS 20% applied"**. No toast anymore.
2. Same patient, session date **after** their SENADIS expiry: badge flips to
   "SENADIS expired {date}…" and Discount derives to $0.00.
3. Non-SENADIS patient: Discount is always $0.00 at booking. (Ad-hoc discounts now happen
   post-booking — scenario 5.)

## 3. Fallback + missing-price paths (G4 / badge)

1. Pick **NM, EEG, EEG/REP, or PSICOT** (provisional default-priced): the amber badge
   "No pricing configured for this specialty/duration — using the default amount." shows and
   the booking proceeds at the DefaultAmount.
2. Pick **Eval-Neuro** (deliberately unpriced): red message
   **"No price configured for Eval-Neuro at {duration} min — ask a manager to set it in
   Admin."** and the Book button stays disabled. This is correct behavior, not a bug.
3. Pick **Ent-TC @ 40 min**: books at the real 40-minute price ($35) — no badge.

## 4. Provider amount preview (MGR/AM only)

1. As **Manager**: the Provider Amt read-only display shows the therapist's fee — flat-fee
   therapist → the flat figure regardless of discount; %-therapist → % of (Amount − Discount).
   Switching therapist updates it. There is **no provider input** anymore (the server always
   derives it).

## 5. BK-3 — post-booking discount edit (gated)

1. As **Front Desk**: open a booked session → Session Details → Financial → Edit.
   - Discount shows **read-only** with the note "Discount edits need a Manager / Assistant
     Manager." Amount stays editable; Provider is display-only ("Recomputed on save").
   - Saving with other changes works (the unchanged discount passes the API gate).
2. As **Manager (or AM)** after re-login: same edit surface — Discount **is editable**.
   - For an active-SENADIS session the hint shows "SENADIS floor: min $X (20%) — may go up,
     never below." Try saving below the floor → the API rejects (400).
   - Raise the discount above the floor → saves; re-open: **Provider/Due recomputed** (a
     %-fee therapist's provider drops when the discount rises).
3. Verify a MGR editing a **legacy odd-duration session** (e.g. 50 min) and saving a
   discount change does NOT alter its duration (the PUT omits duration now).

## 6. On-site visit (DORMANT — will only appear once a specialty's OfferedOnSite is flipped)

1. Today: no specialty shows the "On-site visit (domiciliar)" checkbox (all flags off) —
   confirm it's absent.
2. (Post-flip smoke) With an offeredOnSite specialty: checkbox appears → checking it requires
   choosing a site and shows **"On-site visit charge: $X"** as its own line (never folded into
   Amount). The booked session's Due includes the charge; a %-therapist's provider amount is
   unchanged by it.

## 7. Regression sweep

- Walk-in booking still works (same modal) — money derived the same way.
- Discovery-first filtering, caretaker hard-block, double-booking 409: unchanged.
- Therapist reassignment on a legacy session no longer resets its duration to 60.
- Bulk scheduling from a treatment plan books at price-sheet amounts (not $65/h) and derives
  SENADIS discounts per session date; a plan line with an unpriced specialty reports a
  conflict and nothing books.

**Suite:** `npx vue-tsc --noEmit && npm run lint && npx vitest run` → **307 passed**
(baseline 294; wp40 spec added, wp23/wp37 booking specs rewritten to derived semantics).
