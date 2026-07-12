# Test Scenarios — Admin › Merge Patients (WP-22C, F2)

**Pre-req:** API with WP-22B deployed (and DB migration V025 applied — the merge writes an
audit row). Log in as **SYSADMIN**. Non-SYSADMIN operators (MGR/AM/FD/OWN/ACCT) must never
see this feature.

## 1. Visibility (SYSADMIN-only)

1. Log in as **SYSADMIN** → Admin. The left accordion shows a **Data Maintenance** group with
   a **Merge Patients** item between Reference Data and Security.
2. Log in as **MGR** (or any other operator role). `/admin` redirects away (route is
   SYSADMIN-only today); even if the Admin page were reachable, the Data Maintenance group
   would not render — it is gated on the `Patients.Merge` claim, which no granular role holds.

## 2. Pick the pair

1. Admin → Data Maintenance → Merge Patients.
2. In **Survivor (record to KEEP)** type part of a duplicated child's name (e.g. `bultron`) —
   a dropdown filters by name, MRN, or cedula (max 8 results; inactive patients labeled).
3. Pick the record to keep — it renders as a green card with MRN + cedula.
4. In **Duplicate (record to DELETE)** search again — the already-picked survivor is excluded
   from results. Pick the misspelled twin — red card.
5. The **swap** button exchanges the two selections (use when you picked them backwards).
6. **Preview merge** is disabled until both sides are picked.

## 3. Preview

1. Click **Preview merge**. Two identity cards render side-by-side (green Keep / red Delete)
   with MRN, cedula, DoB, gender, status, and session / treatment-plan / caretaker counts.
2. "What this merge will do" lists: sessions + plans moving, each caretaker's fate (moved /
   duplicate link removed / placeholder retired), any blank survivor fields inherited from the
   duplicate (DoB, cedula, gender, notes — **never the MRN**), and the final permanent-delete
   line.
3. Amber warnings appear where relevant (e.g. survivor has a TEMP- MRN while the duplicate has
   a real one; both records carry different cedulas; a primary-caretaker designation dropped).
4. **Blocker case:** preview a duplicate whose login user also holds another role (e.g. is
   also a Caretaker identity) → a red "This pair cannot be merged" box lists the reason and
   the confirm/execute step does not render at all.

## 4. Type-to-confirm + execute

1. On a clean preview, the confirm box asks you to type the **duplicate's MRN** (falls back to
   the exact full name when the MRN is temporary/missing).
2. Typing anything else keeps **Merge & Delete duplicate** disabled; the exact MRN enables it.
3. Click it. On success a green result card shows the merge-log id and actual counts
   (sessions moved, plans moved, caretaker links moved/deduped/placeholders retired, fields
   inherited). **Merge another pair** resets the panel; the patient list reloads (the deleted
   duplicate no longer appears anywhere in the app).
4. Verify the survivor via Patients: session count now includes the duplicate's sessions
   (Session History tab), and the duplicate's record/name is gone from the All-patients grid.

## 5. Failure surfaces

1. If the API rejects the merge (409 blocker raced in, network error), a red banner shows the
   message and the preview stays on screen — nothing was changed (the merge is a single
   transaction server-side).
2. Preview is side-effect-free: preview repeatedly, navigate away, come back — no data changes
   until the confirm button is pressed.
