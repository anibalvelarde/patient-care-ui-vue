# UI Design Ideas — Neurocorp Patient Care

Reference document for proposed UI design directions. Each option represents a structurally distinct layout and interaction pattern, not just a color/theme variation. Any of these can support a dark-mode toggle.

---

## Already Built

| Option | Route | Theme | Layout | Key Differentiator |
|--------|-------|-------|--------|--------------------|
| Current | `/current` | Pink/coral, monospace | Sidebar nav | Original UI preserved as-is |
| 01 - Clean Medical | `/option-01` | Blue/teal + slate | Top nav bar | AM/PM card-based tables with status pills |
| 02 - Dashboard Cards | `/option-02` | Violet/indigo on gray | Slim icon sidebar | Mini month calendar, stats cards, tab switcher |
| 03 - Modern Dark | `/option-03` | Cyan/emerald on slate-900 | Top command bar | Dark mode, data-dense columnar table |
| 04 - Kanban Board | `/option-04` | Indigo/purple | Slim top bar + date nav | Status swim lanes (Upcoming/Completed/Past Due), card-based |
| 05 - Command Center | `/option-05` | Rose/orange | Compact top bar | Fixed grid: Calendar + AM table + PM table, alert strip, no scrolling |
| 06 - Split Panel | `/option-06` | Slate/blue-gray | Top bar + collapsible calendar | Outlook-style master-detail: compact list left, full details right |
| 07 - Warm Minimal | `/option-07` | Cream/amber/stone | Warm header + week pills | Large single-column cards, no tables, calm therapy-center feel |

---

## Proposed (Not Yet Built)

### Option A: Timeline / Agenda View
- Layout centers on a **vertical timeline** as the main element — a continuous scrollable day view with time slots on the left and appointment cards branching off to the right
- Calendar is a compact **horizontal date scroller** pinned at the top (like Google Calendar's day view)
- No traditional table — appointments are spatial, positioned by time
- Great for front-desk staff who think in terms of "what's happening now/next"

### Option B: Kanban / Swim Lanes --- BUILT as Option 04
- Appointments organized into **columns by status**: Upcoming, Completed, Past Due
- Each appointment is a card with patient, therapy, amount, and notes
- Horizontal layout — feels like a Trello board for the day's schedule
- Inline date nav in top bar (prev/next day + Today button)
- Summary strip shows counts by status

### Option C: Split Panel / Master-Detail --- BUILT as Option 06
- Left panel shows a **compact appointment list** (just name + time + status dot)
- Clicking a row expands a **detail panel** on the right with full info: therapy type, therapist, payment breakdown, notes
- Calendar lives in a collapsible top section
- Feels like an email client (Outlook/Gmail style) — familiar pattern for office staff

### Option D: Warm Minimal --- BUILT as Option 07
- Cream/sand/stone palette, generous whitespace, large rounded elements
- **Horizontal pill tabs** for weekday selection (Mon-Sat as big rounded buttons)
- Appointments as **large cards** in a single column — each card shows everything at a glance, no table at all
- Calm, approachable — fits a therapy center's brand
- Structurally the simplest, but most visually distinct from the current options

### Option E: Command Center / Dense Grid --- BUILT as Option 05
- Inspired by ops dashboards — **everything visible at once**, no scrolling
- Top: compact header + stats strip. Left: mini calendar. Center: AM table. Right: PM table. Bottom: alert strip with past-due pills
- Fixed `h-screen` layout, no tabs or toggling — pure information density
- Tiny text, tight spacing, maximum data per pixel
- Rose/orange accent palette
