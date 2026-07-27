# WP-35C (SH-1/2/3) — Session History Pack: owner walkthrough

Three upgrades to **Patients › Session History** (the expandable per-patient list):

1. **From date (SH-1)** — each patient row now shows **From** (first session) next to
   **Last Session**, so the row reads From/Through.
2. **Notes reveal (SH-2)** — session rows with booking notes show a small **note icon**;
   tapping it reveals the **full** note.
3. **Print / Save as PDF (SH-3)** — a printer button per patient opens a date-range dialog,
   then prints that patient's sessions (with notes) via the browser's print dialog —
   same "Save as PDF" flow as the Statements screens.

**Prereqs:** API **WP-35B** deployed (summary rows carry `firstSessionDate`; the sessions
endpoint accepts `from`/`to`). Additive — against an older API the From column just shows "—"
and printing still works (the From picker simply isn't clamped at the lower end).

## Scenario 1 — From/Through on the patient list

1. Go to **Patients › Session History**.
2. Each row now reads Patient / MRN / **From** / **Last Session** / Total Sessions.
3. Pick a long-standing patient (many sessions): **From** is their earliest session of ANY
   status (it can be earlier than their first *completed* one — that's intended, ruling G1).
4. On mobile, the card's detail line reads `MRN · From: … · Last: …`.

## Scenario 2 — zero-session patient

1. Find a patient with **0** total sessions (search a freshly added patient).
2. Their row shows **—** for both From and Last Session.
3. The printer button on that row is **disabled** — there is nothing to print.

## Scenario 3 — notes reveal (including a long note)

1. Expand a patient whose sessions have booking notes (book one with a long, multi-sentence
   note if needed).
2. Only rows **with** notes show the small note icon; rows without notes show nothing there.
3. **Tap/click** the icon: a card opens with the **entire** note — no "…" truncation; very long
   notes scroll inside the card. Tapping the icon must NOT open the session's Dashboard view
   (the row itself still does).
4. On desktop, hovering the icon for a moment also opens it. Close with another tap, **Esc**,
   or a click anywhere outside.
5. Works the same on a phone (this was the point — the Dashboard's hover tooltip is invisible
   on touch).

## Scenario 4 — print a multi-page patient to PDF

1. Pick a patient with **more than 25 sessions** (their expanded list shows several pages).
2. Click the **printer** icon on their row. A small dialog opens with **From / Through** date
   pickers **pre-filled with that patient's actual first and last session dates**.
3. Try to pick a date outside that span — the pickers won't allow it (and typing one shows an
   error and disables the button).
4. Confirm **Print / Save as PDF**. The browser print dialog opens showing ONLY the report —
   no sidebar/header/app chrome:
   - Header: **NeuroCorp Therapy Center · Session History**, patient name + MRN, the chosen
     From/Through range, and today's printed-on date.
   - **Every** session in the range, oldest first — including the ones beyond page 1 of the
     on-screen list. Verify the trailing "N sessions" count matches the row's Total Sessions.
   - Each session with a note prints the **full note text** on a line beneath its row;
     sessions without notes have no notes line.
   - **No Provider amount column anywhere** (regardless of who is logged in).
5. Choose "Save as PDF" as the destination and save — that's the PDF.
6. Cancel the browser dialog instead: you're back on the app, nothing broken.

## Scenario 5 — totals band foots against the table

1. Print a patient with a healthy mix of sessions (include at least one discounted session and
   one that's only partially paid).
2. Below the report header, above the sessions table, a **totals band** shows:
   **Sessions · Amount · Discount · Paid · Owed**.
3. Verify the numbers **foot against the table rows** — over ALL printed pages, not just the
   first: Sessions = the row count (equals the trailing "N sessions" line), Amount / Discount /
   Paid = the sums of those columns, and **Owed = the sum of the "Owes …" cells** (rows marked
   "Paid …" contribute nothing to Owed).
4. Cancelled/zeroed sessions are **counted** in Sessions and simply add their $0.00 amounts.
5. No Provider figure appears in the band (or anywhere else in the report).
6. On an empty-range print, the band reads 0 sessions and $0.00 across.

## Scenario 6 — range-narrowed export

1. Open the print dialog for the same patient, but narrow the range (e.g. just the last
   two months).
2. Confirm. The report shows **only** sessions inside that range (inclusive on both ends —
   a session exactly on the From or Through date IS included), and the header states the
   narrowed range.
3. A range with no sessions in it prints a page saying "No sessions in the selected range."

## Scenario 7 — lifetime money columns + page totals band (claim-gated)

> Needs the WP-35B money addendum deployed API-side. Money visibility rides the existing
> **Appointments.ProviderAmount** claim (MGR/AM/OWN see it; FD/ACCT don't) — no re-login
> change, no new permission.

1. Sign in as **MGR** and open **Patients › Session History**.
2. Above the list, a **totals band** shows: **Patients** (all matching patients), **Sessions**,
   **Gross**, **Discounts**, **Gross Profit** — aggregated over the WHOLE filtered census,
   not just the visible page.
3. Each patient row now also has **Gross / Discount / Gross Profit** columns (lifetime sums,
   any status) next to Total Sessions; the mobile card gains a `Gross · Disc · GP` line.
4. **Type a search** (e.g. a family name): as the list narrows, watch the band's numbers
   shrink to just the matching patients — they always describe everything the search matches,
   even across multiple pages.
5. Sign in as **FD** (front desk): the page still works — Patients and Sessions counts show in
   the band, but there are **no money columns and no $ figures anywhere** (not even $0.00 —
   the API omits the fields entirely). No error, no 403.
6. Nowhere on this page (screen or the printed report) does a Provider amount appear.

## Notes

- No new permission — everything rides `Patients.View`, no re-login needed.
- The print flow fetches every page of the range before opening the dialog; on a very large
  range expect a brief "Preparing…" moment.
