# WP-38 — Merge Panel Selection-Change Reset: Owner Walkthrough

Bug fix (punch-list MRG-1, SYSADMIN-only surface). Previously, changing the survivor or the
duplicate **after** running a preview left the stale preview — including its type-to-confirm and
Execute button — on screen describing the OLD pair, while Execute would have merged the NEW pair.
Now any selection change while a preview is up asks first, then wipes the stale preview.

UI-only: no API deploy, no reseed, no re-login.

## Scenario 1 — Change the duplicate after preview → warning → clean slate

1. Log in as the SYSADMIN account → Admin → Data Maintenance → Merge Duplicate Patients.
2. Pick a survivor and a duplicate (any two test patients), click **Preview merge**.
3. With the preview cards on screen, change the **Duplicate** picker to a different patient.
4. **Expect:** a dialog — "Discard this preview? Changing the selection discards the current
   preview and its confirmation…" with **Keep preview** / **Discard preview** buttons.
   The screen behind it is dimmed; clicking the backdrop does nothing (the choice is explicit).
5. Click **Discard preview**.
6. **Expect:** the preview cards, the type-to-confirm box, and the Merge & Delete button are all
   gone. Both pickers **keep their current values** (survivor unchanged + your new duplicate).
   You must click Preview merge again to stage anything.

## Scenario 2 — Keep preview (cancel path)

1. Repeat steps 1–3 above (preview up, change a picker).
2. In the dialog, click **Keep preview**.
3. **Expect:** the picker snaps back to the patient it had before your change, the preview stays
   exactly as it was, and no second dialog appears.

## Scenario 3 — Typed confirmation never survives

1. Preview a pair and type the duplicate's MRN into the confirm box (Execute button lights up).
2. Change the **Survivor** picker → **Discard preview**.
3. Click **Preview merge** for the new pair.
4. **Expect:** the confirm box is empty and Execute is disabled until you type the (new)
   duplicate's MRN.

## Scenario 4 — Swap stays silent

1. Preview a pair, then click the **⇄ swap** button between the pickers.
2. **Expect:** no dialog — the two pickers trade places and the preview clears immediately
   (swap is an intentional pair-preserving action; it was already safe).

## Notes

- The guard only arms while a preview is on screen — changing pickers before any preview never
  prompts.
- The server re-validates the pair on execute regardless; this fix removes the client-side
  wrong-patient hazard where the operator reads cards for one pair while Execute targets another.
