---
name: refactor
description: Restructure Vue/TypeScript code without changing visible behavior
user-invocable: true
---

# Refactor — UI

## Process

1. **Check for existing branch:** `git branch -a | grep -E "feature/|fix/"`. Create `feature/<desc>` if needed.
2. **Understand scope** — Read affected files, identify cross-option dependencies.
3. **Plan** — List files to create/move/modify/delete. Identify breakage points (imports, routes, props).
4. **Execute** — Incremental changes. After each step:
   - `npx vue-tsc --noEmit`
   - `npm run lint`
5. **Verify:**
   - [ ] Type-check passes
   - [ ] Lint passes
   - [ ] All routes resolve
   - [ ] Shared components work across all options that use them

## Common Refactors

| Refactor | Watch out for |
|----------|---------------|
| Extract shared component | Update imports in all consuming options |
| Consolidate duplicate logic | Move to `composables/`, ensure reactivity works |
| Rename component | Update parent imports and template refs |
| Extract interface/type | Update all importing files |

## Rules
- Never change visible behavior
- Never modify original UI components (`headers/`, `sidebars/`, `appointments/`, `calendars/`, `actions/`, `footers/`)
- If extracting shared component, make it themeable via props (see `JumpToDate.vue`)
