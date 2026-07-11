# Test Scenarios — Session Details slide-over restyle (Option B)

**Origin:** owner picked Option B from
`patient-care-super/planning/mockups/session-details-restyle-options.html` (2026-07-11).
Pure template restyle of `ActionsPanel.vue` — no script/behavior changes, no API change.

## Scenario 1 — Layout & scroll depth
1. Appointments → any row → ellipsis (Session Details).
2. **Expect:** panel is ~50% wider (672px); header shows "Session #<id> · date · time",
   the patient name large, and chips for Status / Specialty / Discovery (when applicable).
3. **Expect:** body shows Therapist and Caretaker as side-by-side cards, Notes card (only
   when notes exist), and a Financial stat strip — with little or no scrolling before any
   interaction.

## Scenario 2 — Caretaker card (B3 data)
1. Open details for a patient with a caretaker.
2. **Expect:** Caretaker card shows name, phone with icon, email with icon (truncated with
   tooltip when long). No caretaker → card shows "—" and no contact lines.

## Scenario 3 — Financial strip & role gating
1. As MGR/AM: **expect 5 tiles** — Amount, Discount, Paid (green), Provider (violet), Due.
   Due tile is red-tinted when > $0, green-tinted when $0. "Past Due (35-day rule)" note
   appears below when applicable.
2. As FD: **expect 4 tiles** (no Provider), matching WP-17 shaping.
3. Click Edit → the violet edit form appears (Amount/Discount/Provider-gated), Save/Cancel
   behave exactly as before.

## Scenario 4 — Collapsible action groups
1. On a **Proposed** session: "Record Confirmation Attempt" group is present and **expanded
   by default**; Method+Notes sit side by side, the 4 result buttons in one row; Submit is
   disabled until a result is picked. Recording works as before.
2. "Change Status & Treatment Plan" group is **collapsed**; clicking the header expands it
   (chevron flips). Status buttons (3-per-row), the terminal-status "Correction mode"
   warning + unlock, the create-plan-from-discovery CTA (completed discovery only), and
   "View Patient's Treatment Plans" all behave as before.
3. "Cancel Appointment" group (red, collapsed) appears only for non-terminal sessions;
   reason input + button on one row; cancelling works as before.
4. On a Confirmed/Completed session: no confirmation group; cancel group hidden for
   terminal statuses — same visibility rules as the old panel.

## Scenario 5 — Claims
1. FD without `Appointments.Book` (if applicable): confirmation/status/cancel controls are
   hidden exactly as before; the Treatment Plan buttons remain visible inside the middle
   group.
