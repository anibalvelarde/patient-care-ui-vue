# Release Skill

## When to Use
Before merging a feature branch to `main` or preparing a release build.

## Pre-Release Checklist

### Build & Type Safety
- [ ] `npm install` completes without errors
- [ ] `npx vue-tsc --noEmit` passes with no type errors
- [ ] `npm run lint` passes with no violations
- [ ] Dev server starts cleanly (`npm run dev`)

### Route & Navigation Verification
- [ ] All routes in `router/index.ts` resolve to existing view files
- [ ] `CompareView.vue` has cards for every option with correct routes
- [ ] "Back to Options" link works on every option view
- [ ] No dead routes or orphaned views

### Component Integrity
- [ ] Every option view fetches data via `SessionsHttpClient`
- [ ] Date navigation (prev/next/today/jump) works across all options
- [ ] Shared components (`JumpToDate`, etc.) function correctly in all options that use them
- [ ] No broken imports or missing component registrations

### Documentation
- [ ] `UI-DESIGN-IDEAS.md` reflects current state (built vs. proposed)
- [ ] `CLAUDE.md` is up to date with any new paths or conventions
- [ ] `docs/architecture.md` reflects current component structure
- [ ] New ADRs written for significant architectural decisions

### Code Quality
- [ ] No `console.log` statements (only `console.error` for caught exceptions)
- [ ] No TODO/HACK/FIXME comments left unresolved
- [ ] No hardcoded URLs or credentials
- [ ] No unused imports or dead code
- [ ] Original UI components remain untouched

### Git Hygiene
- [ ] All changes are committed
- [ ] Commit messages are descriptive
- [ ] Branch is up to date with `main` (rebase or merge)
- [ ] No merge conflicts
