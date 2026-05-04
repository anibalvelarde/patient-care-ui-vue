# app-ui

Vue 3 + TypeScript + Vite SPA for Neurocorp Patient Care. See [`../CLAUDE.md`](../CLAUDE.md) for full project context.

## Setup

```bash
npm install
```

## Develop

```bash
npm run dev          # Vite dev server → http://localhost:8080
```

## Type-check, lint, build

```bash
npx vue-tsc --noEmit   # Type-check (run before commit)
npm run lint           # ESLint
npm run build          # Production build → dist/
```

## API base URL

Configured at runtime via `public/config.js` (Docker entrypoint overwrites this in prod). For local dev, set `VITE_API_BASE_URL` in `.env` to point at a running `patient-care-api` instance — defaults to `http://localhost:5245`.

## Build-time version constants

`__APP_VERSION__`, `__APP_COMMIT__`, `__APP_BUILD_TIME__` are inlined at build time via Vite's `define` (see `vite.config.ts`). Surfaced in the footer (`UiVersion.vue`) and Admin → About panel (`AboutPanel.vue`).
