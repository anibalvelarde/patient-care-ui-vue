# Neurocorp Patient Care UI (Vue)

## What Is This?

A Vue 3 single-page application for the Neurocorp Therapy Center front-desk patient care workflow. Displays daily appointment schedules with session details, payment status, and therapist assignments. The app currently hosts a **UI design comparison framework** with 7+ design options on a single branch, all sharing the same data layer.

## Cross-Project Context

Part of NeuroCorp multi-project system. See `../CLAUDE.md` for system map, dependency ordering, branch workflow, and kanban integration. Always produce user-facing test scenarios for new/modified UI features.

## Architecture

- **Framework**: Vue 3 with Composition API (`defineComponent` + `setup()`)
- **Language**: TypeScript 5.x
- **Build Tool**: Vite 6.x (dev server on port 8080)
- **Styling**: Tailwind CSS 3.x with custom `medical` color palette
- **Routing**: Vue Router 4.x (client-side, history mode)
- **Icons**: Font Awesome 6.x via `@fortawesome/vue-fontawesome`
- **Font**: Poppins (loaded from Google Fonts in `index.html`)

## Key Paths

```
app-ui/                          # Main application directory
├── index.html                   # Entry HTML
├── vite.config.ts               # Vite config (port 8080, @ alias)
├── tailwind.config.js           # Tailwind config with custom colors
├── tsconfig.json                # TypeScript config (@ → src/*)
├── package.json                 # Dependencies
├── src/
│   ├── main.ts                  # App entry point
│   ├── App.vue                  # Root component (router-view)
│   ├── router/index.ts          # Route definitions
│   ├── interfaces/Appointment.ts  # Core data interface
│   ├── services/
│   │   ├── HttpClientBase.ts    # Base HTTP client
│   │   └── SessionsHttpClient.ts  # Appointment data fetching
│   ├── views/                   # Page-level components
│   │   ├── CompareView.vue      # Landing page with option cards
│   │   ├── CurrentView.vue      # Original UI preserved
│   │   └── Option0XView.vue     # Design option pages (01–07)
│   └── components/
│       ├── shared/              # Cross-option components (JumpToDate)
│       ├── option01/ – option07/  # Per-option component directories
│       ├── headers/             # Original UI components (untouched)
│       ├── sidebars/            # Original UI components (untouched)
│       ├── appointments/        # Original UI components (untouched)
│       ├── calendars/           # Original UI components (untouched)
│       ├── actions/             # Original UI components (untouched)
│       └── footers/             # Original UI components (untouched)
docs/                            # Project documentation
UI-DESIGN-IDEAS.md               # Design option reference and status
UI-REVAMP-CONTINUATION.md        # Session continuation prompt
```

## Build & Run

```bash
cd app-ui
npm install              # Install dependencies
npm run dev              # Dev server → http://localhost:8080
npx vue-tsc --noEmit     # Type-check without emitting
npm run lint             # ESLint
```

## API Dependency

The app fetches appointment data from the `patient-care-api` (.NET 8 REST API):
- **Base URL**: Configured via `VITE_API_BASE_URL` env var (default: `http://localhost:5245`)
- **Endpoint**: `GET /api/Sessions/{yyyy-MM-dd}/all`
- **Date format**: API expects `yyyy-MM-dd`; the app stores dates as `en-US` locale strings and converts in `SessionsHttpClient`

## Conventions

- **Component naming**: Per-option components use `O{N}` prefix (e.g., `O1Navbar`, `O6DetailPanel`)
- **Component organization**: Each option gets its own directory under `components/option0X/`
- **View pattern**: Each option view manages `selectedDate`, fetches via `SessionsHttpClient`, and includes a "Back to Options" router-link
- **Shared components**: Cross-option utilities go in `components/shared/`
- **Styling**: All styling via Tailwind utility classes — no separate CSS files for option components
- **Original UI**: Components in `headers/`, `sidebars/`, etc. are preserved untouched
- **Target user**: Front-desk staff (role badge shown in UI)

