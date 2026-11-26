---
name: release
description: Validate UI release readiness
user-invocable: true
---

# Release — UI

## Build & Type Safety
- [ ] `npm install` completes without errors
- [ ] `npx vue-tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] Dev server starts cleanly (`npm run dev`)

## Local Stack (PII-free) — `../patient-care-db/tools/local-dev/`
- [ ] `local-dev.sh up` with this branch checked out → DB, API and UI ready
- [ ] `local-dev.sh walk` exits 0 (no console errors, page errors, failed requests or 5xx)
- [ ] Console warnings are not higher than the `main` baseline (`walk main` on main)
- [ ] `local-dev.sh down` afterwards (unless the owner is localhost-testing)

## Routes & Navigation
- [ ] All routes in `router/index.ts` resolve to existing views
- [ ] `CompareView.vue` has cards for every option
- [ ] "Back to Options" link works on every option view

## Component Integrity
- [ ] Every option view fetches via HTTP clients
- [ ] Date navigation works across all options
- [ ] Shared components function in all consuming options

## Code Quality
- [ ] No `console.log` statements
- [ ] No TODO/HACK/FIXME unresolved
- [ ] No hardcoded URLs or credentials
- [ ] No unused imports or dead code
- [ ] Original UI components untouched

## Documentation
- [ ] `UI-DESIGN-IDEAS.md` reflects current state
- [ ] `CLAUDE.md` up to date
- [ ] `docs/architecture.md` reflects current structure
