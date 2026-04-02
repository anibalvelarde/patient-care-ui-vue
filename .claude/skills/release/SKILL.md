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
