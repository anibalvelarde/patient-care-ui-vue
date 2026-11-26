# Test scenarios — Statements print hides the app header

**Fix:** on the Statements page the app header (greeting, New Appointment / Add Patient / Payment
buttons, Sign out) and the mobile top bar were printed on every statement. They are now hidden
when printing, like the sidebar already was. Nothing changes on screen.

## Scenario 1 — Caretaker statement prints without the app header
1. Sign in as Front Desk (or any role that can see Statements) and open **Statements**.
2. On the **Caretaker** tab, pick a caretaker and a date range → **Generate Statement**.
3. Open the browser's print preview (Ctrl+P).
4. ✅ The preview shows only the statement: no "Good afternoon, …" greeting, no header buttons,
   no sidebar, no Sign out.

## Scenario 2 — Therapist statement prints without the app header
1. On **Statements**, switch to the **Therapist** tab, pick a therapist and range → generate.
2. Ctrl+P.
3. ✅ Same as above: only the statement content is in the preview.

## Scenario 3 — Mobile / narrow window
1. Narrow the browser window until the purple mobile top bar appears (phone width).
2. Generate any statement → Ctrl+P.
3. ✅ The purple mobile bar is not in the print preview.

## Scenario 4 — Screen layout unchanged
1. On **Statements** (normal screen, not print), check the header, sidebar and tabs.
2. ✅ Everything looks and works exactly as before: greeting, buttons, Sign out, tab switching.
