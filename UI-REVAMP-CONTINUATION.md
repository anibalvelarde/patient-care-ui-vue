# UI Revamp - Continuation Prompt

Use this prompt to resume the UI revamp work in a fresh session.

---

## Context Prompt (copy/paste this to start your next session)

```
I'm continuing work on a UI revamp for the Neurocorp Patient Care Vue app. Here's where we left off:

## Branch
- Working branch: `features/claude/ui-revamp-option-01`
- All UI options live on the SAME branch as separate routes/pages (not separate branches)

## What's Already Built
The app uses Vue 3 + TypeScript + Vite + Tailwind CSS 3.

We added Vue Router so the app now has multiple pages:
- `/` — Comparison landing page (CompareView.vue) with cards linking to each option
- `/current` — The original UI preserved as-is
- `/option-01` — "Clean Medical" design (blue/teal, top nav, card-based tables)
- `/option-02` — "Dashboard Cards" design (violet sidebar, stats cards, mini month calendar, tabbed appointment list)

### File Structure Added
- `src/router/index.ts` — Vue Router config
- `src/views/` — CompareView, CurrentView, Option01View, Option02View
- `src/components/option01/` — O1Navbar, O1ActionBar, O1Calendar, O1Appointments, O1AppointmentCard, O1Footer
- `src/components/option02/` — O2Sidebar, O2Header, O2StatsBar, O2Calendar, O2Appointments, O2Footer

### Key Design Decisions Already Made
1. Target user: Front-desk staff primarily (role badge shown in UI)
2. Data fetching uses existing `SessionsHttpClient` service (in `src/services/`)
3. Notes column has a hover tooltip (shows to the LEFT of the cell to avoid header clipping)
4. Each option page has a "Back to Options" link for easy comparison
5. The comparison page at `/` shows all options as clickable cards

## Design Directions Already Explored
| Option | Theme | Nav Style | Calendar | Appointments | Palette |
|--------|-------|-----------|----------|--------------|---------|
| 01 - Clean Medical | Professional, airy | Top nav bar | Week list sidebar | AM/PM card tables with status pills | Blue/teal + slate |
| 02 - Dashboard Cards | Info-dense, widget-based | Slim icon sidebar | Mini month grid + week strip | All/AM/PM tab switcher, row-based with color bars | Violet/indigo on gray |

## What's Next — Options for New Designs
The following directions were discussed but NOT yet built. Pick one or more to build next:

### Option A: Modern Dark Mode
- Dark backgrounds (slate-900/gray-900), vibrant accent colors
- Data-dense layout, great for staff on screens all day
- Could use cyan/emerald accents on dark surfaces

### Option B: Warm Minimal
- Light warm neutrals (cream, sand, stone), generous whitespace
- Soft rounded elements, calm/approachable feel fitting for a therapy center
- Horizontal week pill tabs for the calendar, large card rows for appointments

### Option C: Something Entirely Different
- Open to other directions — hybrid approaches, unique layouts, etc.

## How to Add a New Option
1. Create `src/views/Option0XView.vue`
2. Create `src/components/option0X/` with the sub-components
3. Add route in `src/router/index.ts`
4. Update `src/views/CompareView.vue` to add the new card
5. Use `SessionsHttpClient` for data fetching (same pattern as existing options)
6. Include a "Back to Options" link
7. Include left-side tooltip on Notes (or explore a different approach per option)

Please help me build the next option(s). I'd like to `npm run dev` and compare them all before committing.
```

---

## Technical Notes
- Dev server runs on `http://localhost:8080/`
- API base URL configured via `VITE_API_BASE_URL` env var (defaults to `http://localhost:5245`)
- The `Appointment` interface is in `src/interfaces/Appointment.ts`
- Tailwind config extended with custom `medical` color palette in `tailwind.config.js`
- The app loads Poppins font from Google Fonts (in `index.html`)
- Original UI components are untouched in their original directories (`components/headers/`, `components/sidebars/`, etc.)
