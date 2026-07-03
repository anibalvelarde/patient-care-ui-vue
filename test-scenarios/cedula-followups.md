# Cedula Follow-ups — User Test Scenarios

**Branch:** `feature/cedula-followups` (UI) + `fix/cedula-clear-to-null` (API)
**Intake:** `patient-care-super/planning/intake/2026-06-29-001-cedula-followups.md`

> Scenarios 3–4 need the API branch running too — the clear-to-NULL fix is server-side.

---

## Scenario 1 — Cedula PII masked in the All-patients grid (item 1)

**Setup:** Log in (any role with `Patients.View`). Go to **Patients › Patient Management › All** at desktop width.

**Expected:**
- The **Cedula** column never shows a raw ID. Patients with a cedula show a small green **"On file"** badge (hover tooltip: "Cedula on file — open Edit to view"); patients without show a grey **—**.
- The raw value is still visible in the **Edit** modal's Cedula field (single-patient context).
- The list **search box still matches by cedula**: type a known full/partial cedula → the owning patient row appears (the grid still doesn't reveal the number).
- Mobile (narrow window): patient cards show `Cedula: On file` or `Cedula: —`, never the number.
- Clicking the **Cedula** column header sorts by presence (all "On file" rows group together), toggling asc/desc.

---

## Scenario 2 — Actions column no longer clipped (item 2)

**Setup:** Same grid, desktop width (the reporter's screen where Actions clipped before).

**Expected:**
- The right-hand **Actions** header label and icons (caretakers / plans / edit / activate-deactivate) are fully visible — nothing pushed off-screen or chopped.
- The Patients page content area is wider than the other pages (`max-w-screen-2xl` vs the app-standard `max-w-7xl`), giving the 10-column table room.
- Long email addresses truncate with an ellipsis (hover shows the full address in a tooltip) instead of stretching the column.
- Safety net: if the window is narrowed (still ≥ md), the table pane scrolls horizontally rather than clipping the right edge.
- The Cedula column is now badge-width instead of full-ID-width, relieving the column budget.

---

## Scenario 3 — Clearing a Cedula actually erases it (item 3, the bug)

**Setup:** Both branches running. Pick a patient **with** a cedula (or set one first).

**Steps:**
1. **Edit** the patient → blank out the Cedula field entirely → **Save**.
2. Reopen the same patient's Edit modal.

**Expected:**
- The Cedula field is **empty** (previously the old value silently persisted — the bug).
- The grid row now shows **—** instead of "On file".
- DB check (optional): `SELECT Cedula FROM Patient WHERE PatientID = <id>;` → `NULL`.

---

## Scenario 4 — Set / change / re-use after clear (regressions around the fix)

**Steps & expected:**
1. Set a cedula on a patient that has none → saves, grid shows "On file". (Set still works.)
2. Change it to a different value → saves. (Change still works.)
3. Clear patient A's cedula, then assign that same number to patient B → **no 409** (the unique index allows the freed value to be reused; multiple cleared patients = multiple NULLs, also fine).
4. Enter a value with surrounding spaces (` 001-1234567-8 `) → saves trimmed.
5. Edit a patient **without touching** the Cedula field → other edits save, cedula stays as it was (omitted ≠ clear on other flows, e.g. the activate/deactivate toggle).
6. Duplicate check still holds: give patient B a cedula patient A currently holds → **409** with the duplicate-cedula message.
