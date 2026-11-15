# WP-64 — Unsaved-changes guard + price-gap audit — test scenarios

**What changed:**
- The treatment-plan drawer and the scheduling wizard no longer throw away unsaved work on a stray
  click. Every way out asks **"Discard changes?"** first.
- Admin › Specialty Types has a new **Price gaps** tab. It lists every specialty whose price sheet
  leaves a duration with no price and no default price.

**Needs:** UI branch `feature/wp-64-unsaved-guard-price-gaps`. There is no API change; any API from 153-1 onward works.

**Setup:** log in as a Manager (or SYSADMIN). You need a patient with a completed discovery
session. On localhost, patient 921 has one.

## Part 1 — Unsaved-changes guard

### 1. A clean drawer closes as before
1. Treatment Plans → patient → **New plan**. Don't touch anything.
2. Click the dark area to the left of the drawer.
- ✅ The drawer closes with no question. The discovery session the app picked for you doesn't
  count as an edit.

### 2. Edits are protected: backdrop, X and Cancel
1. **New plan** → type something in **Notes** (or change a line).
2. Click the dark area.
- ✅ A **"Discard changes?"** dialog appears, and the drawer stays open behind it.
3. Click **Keep editing**.
- ✅ The dialog closes, and your note is still there.
4. Repeat with the **X** in the drawer header, and with **Cancel**.
- ✅ The same dialog appears each time.
5. This time click **Discard changes**.
- ✅ The drawer closes. Re-opening **New plan** shows a fresh form.

### 3. Keyboard
1. With edits, click the dark area to open the dialog.
- ✅ **Keep editing** has focus. Pressing **Esc** or **Enter** keeps you editing.

### 4. Editing an existing plan
1. Open **Edit** on a Draft plan (or an Active one that isn't scheduled yet). Change a line's
   duration.
2. Click the X.
- ✅ The dialog appears.
3. Keep editing, set the duration back to what it was, then click the X again.
- ✅ No dialog: nothing differs from what you opened, so the drawer closes.

### 5. Leaving the page
1. With unsaved edits in the drawer, click **Patients** (or any other link) in the sidebar.
- ✅ The dialog appears, and you stay on Treatment Plans.
- ✅ **Discard changes** takes you to Patients.
2. With unsaved edits, press **F5** or close the tab.
- ✅ The browser shows its own "Leave site? Changes you made may not be saved" prompt. Its
  wording can't be changed.
3. With no edits, do the same.
- ✅ No prompt.

### 6. Logging off is never blocked
1. With unsaved edits, use **Log out** in the header.
- ✅ You're logged out immediately with no dialog. Idle logoff and session expiry also go straight through.

### 7. Scheduling wizard
1. Active, unscheduled plan → **Schedule Sessions**. Without changing anything, click the dark area.
- ✅ The wizard closes with no question.
2. Re-open it and pick a **site** (or change the start date, or go to step 2). Then click the
   dark area, the X, or Cancel.
- ✅ The dialog appears. **Keep editing** keeps your choices.
3. Finish scheduling until step 3 shows the sessions, then click **Close**.
- ✅ No dialog: the sessions are already saved.

## Part 2 — Price gaps tab

### 8. The audit list
1. Admin › **Specialty Types**.
- ✅ There are two tabs, **Specialties** and **Price gaps**. **Price gaps** shows a red count:
  the number of specialties with at least one gap.
2. Open **Price gaps**.
- ✅ Each row is a specialty with red chips for the durations (30/45/60/90/120) that have no price.
  A specialty with a **default price** never appears, because the default covers every duration.
  Discovery specialties (Eval/Obs) appear too.
- ✅ This matches WP-61: a specialty and duration listed here is exactly what the plan form and
  the wizard refuse with the "No price for …" toast.

### 9. Fix a gap from the list
1. Click **Set prices** on a row.
- ✅ That specialty's price editor opens, the same one as the price-tag icon on the Specialties tab.
2. Add a price for one of the missing durations and save.
- ✅ The chip for that duration disappears, and the count drops if that was the specialty's last gap.
3. Set a **default price** on a specialty (Specialties tab → edit).
- ✅ That specialty disappears from Price gaps entirely.

### 10. Who sees what
- ✅ Anyone who can see Specialty Types sees the Price gaps tab.
- ✅ **Set prices** appears only for users who can edit prices, the same rule as the price-tag icon.
- ✅ With no gaps at all, the tab says "No gaps — every specialty has a price at every duration."
  and there is no count.
