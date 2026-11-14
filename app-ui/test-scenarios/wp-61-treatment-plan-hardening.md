# WP-61 — Treatment-plan hardening — test scenarios

**What changed:**
- A plan can no longer be saved in a state that can never be scheduled.
- An Active plan can be fixed until it is scheduled.
- The scheduling wizard shows real prices.
- Plans are credited to the right therapist.
- Editing an appointment no longer overwrites its therapy type.

**Needs:** API with WP-61B (`fix/wp-61b-treatment-plan-hardening`) + this UI (`fix/wp-61c-treatment-plan-hardening`).

**Setup:**
- Log in as a Manager (or SYSADMIN).
- You need a patient with a **completed discovery session** and a **linked caretaker**. Book a discovery (an Eval/Obs
  specialty), then mark it Completed.
- Price-sheet facts for the checks below (Admin › Specialty prices; adjust if yours differ):
  - **TL** has a 30-min price but **no 60-min price and no default** → this is the "no price" case.
  - **EEG** has only a **default** price → OK at any duration.

## 1. Duration is limited to bookable values
1. Treatment Plans → patient → **New plan**. Pick the discovery session.
2. Open a line's **Duration** dropdown.
- ✅ It offers only **30, 45, 60, 90, 120**. There is no free-number box, and 40 can't be entered.

## 2. Creator = the discovery therapist
1. Same form, discovery session selected.
- ✅ Under the discovery picker: **"Created by: {the discovery session's therapist}"**.
2. Save the plan.
- ✅ The plan card / edit view shows that same therapist as the creator (not therapist #1).

## 3. No price → toast + blocked
1. New plan → line **TL at 60 min**.
- ✅ The line shows a red hint: *"No price for Language Therapy at 60 min — add one in Admin › Specialty prices…"*.
2. Click **Save as Draft**.
- ✅ A toast appears with the same message. The plan is **not** saved, and the form stays open.
3. Change the line to **30 min** (or to EEG at any duration) → Save.
- ✅ The plan saves.
4. *(Optional)* In Admin, add a TL 60-min price, then retry step 1.
- ✅ No hint, and the plan saves.

## 4. Activate is blocked the same way
1. Make a Draft plan whose line has no price. You can do this by removing a price after saving, or by using a legacy plan.
2. Click **Activate**, either in the form or on the plan card.
- ✅ A toast names the specialty and duration. The plan stays Draft.

## 5. Active plan: editable until scheduled
1. Activate a valid plan (line count = sessions per week).
- ✅ The card shows an **Edit** button.
2. Edit → change a line (e.g. its day or duration) → **Save Changes**.
- ✅ The changes are saved, and the plan is still Active.
3. Edit again and remove a line, so the line count no longer matches sessions per week → Save.
- ✅ The save fails with *"An active plan needs one line per weekly session…"*.
4. Close, then **Schedule Sessions** → finish the wizard.
- ✅ After scheduling, the **Edit button is gone** from the card. To change the plan now: cancel it and recreate it.

## 6. Wizard step 2 shows real money, read-only
1. Active, unscheduled plan → **Schedule Sessions** → step 1 (date + site) → **Next**.
- ✅ Each line shows **"Amount: $X"** from the price sheet (TL 30 = the TL 30-min price; EEG = its default). It is no longer
  the old $65/hour figure.
- ✅ The line reads *"Estimate — final amounts in step 3."*. There are **no discount boxes**.
2. Repeat with a patient who has **active SENADIS**.
- ✅ Step 2 shows *"SENADIS 20%: −$… → Net $…"*. With an expired SENADIS: the "SENADIS expired …" badge, and no discount.
3. Finish.
- ✅ The step-3 amounts match step 2, minus SENADIS.

## 7. Wizard blocks a line with no price
1. Make an Active plan whose line has no price for its duration (e.g. remove the price after activating).
2. Open **Schedule Sessions** → step 2.
- ✅ A toast appears on open, plus the red **"Scheduling blocked — a line has no price"** banner and a per-line hint.
- ✅ **Schedule Sessions is disabled.**

## 8. Appointment edits keep the therapy type
1. Open any booked appointment.
2. Change only its money fields (**Edit financials**), or reassign it to a different therapist → Save.
- ✅ The appointment's therapy/specialty label is unchanged. Before WP-61 an empty one could become "N/A".
