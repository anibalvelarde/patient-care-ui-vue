# Architecture — Patient Care UI (Vue)

## Overview

The Patient Care UI is a single-page application built for front-desk staff at the Neurocorp Therapy Center. Its primary function is displaying daily appointment schedules — who is coming in, what therapy they're receiving, their payment status, and any notes.

The application currently serves as a **UI design comparison framework**: multiple distinct layout and interaction patterns are implemented side-by-side on the same branch, sharing a common data layer. This allows stakeholders to compare options before selecting a final design direction.

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Vue 3 (Composition API) | 3.5.x |
| Language | TypeScript | 5.7.x |
| Build | Vite | 6.x |
| Styling | Tailwind CSS | 3.4.x |
| Routing | Vue Router | 4.6.x |
| Icons | Font Awesome | 6.7.x |
| Font | Poppins | Google Fonts |

## Application Layers

```
┌──────────────────────────────────────────┐
│              Views (Pages)                │
│   CompareView, Option01View, etc.         │
│   Manages state, orchestrates components  │
├──────────────────────────────────────────┤
│           Components (UI)                 │
│   Per-option: O1Navbar, O6DetailPanel     │
│   Shared: JumpToDate                      │
├──────────────────────────────────────────┤
│          Services (Data)                  │
│   SessionsHttpClient → API calls          │
│   HttpClientBase → fetch wrapper          │
├──────────────────────────────────────────┤
│        Interfaces (Contracts)             │
│   Appointment (core data shape)           │
└──────────────────────────────────────────┘
```

### Views
Each view corresponds to a route and represents a complete page layout. Views are responsible for:
- Managing the selected date state
- Fetching appointments via `SessionsHttpClient`
- Passing data down to child components via props
- Handling events emitted by child components

### Components
Organized into per-option directories (`option01/` through `option07/`) and a `shared/` directory. Each option's components are self-contained and do not import from other options. Shared components are designed to be themeable via props (e.g., `JumpToDate` accepts color class props).

### Services
A thin data layer built on `HttpClientBase`:
- `HttpClientBase` wraps `fetch()` with the configured `VITE_API_BASE_URL`
- `SessionsHttpClient` exposes `getSessions(date)` and handles date format conversion (`en-US` → `yyyy-MM-dd`)

### Interfaces
The `Appointment` interface defines the shape of data returned by the API. All components that display appointment data reference this interface.

## Data Flow

```
User selects date → View updates selectedDate ref
    → Watch triggers fetchAppointments()
    → SessionsHttpClient.getSessions(date)
    → GET /api/Sessions/{yyyy-MM-dd}/all
    → Response mapped to Appointment[]
    → Reactive ref updates → Components re-render
```

## Design Options

The comparison framework currently includes 7 design options plus the original UI:

| Option | Layout Pattern | Key Structural Difference |
|--------|---------------|--------------------------|
| Current | Sidebar + table | Original UI preserved |
| 01 — Clean Medical | Top nav + card tables | AM/PM split with status pills |
| 02 — Dashboard Cards | Icon sidebar + widgets | Stats cards, mini calendar, tab switcher |
| 03 — Modern Dark | Top bar + dense table | Dark theme, data-dense |
| 04 — Kanban Board | Swim lanes | Status columns (Trello-style) |
| 05 — Command Center | Fixed grid | No scrolling, everything visible |
| 06 — Split Panel | Master-detail | Outlook-style list + detail |
| 07 — Warm Minimal | Single column cards | No tables, warm palette |

Each option is a structurally distinct layout, not just a color variation.

## API Dependency

The UI depends on the `patient-care-api` (.NET 8 REST API) for appointment data. The API must be running locally on port 5245 (or configured via `VITE_API_BASE_URL`). See the [patient-care-api](https://github.com/anibalvelarde/patient-care-api) repo for setup instructions.
