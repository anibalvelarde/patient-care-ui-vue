# Refactor Skill

## When to Use
When restructuring or improving Vue/TypeScript code without changing visible behavior — extracting shared components, reorganizing files, improving type safety, or consolidating patterns.

## Process

### 1. Understand Scope
- Read all files affected by the refactor
- Identify which options or shared components are impacted
- Check for cross-option dependencies (shared components, services, interfaces)

### 2. Plan
- List every file that will be created, moved, modified, or deleted
- Identify potential breakage points (imports, route changes, prop changes)
- Decide whether changes should be incremental commits or a single commit

### 3. Execute
- Make changes incrementally — one logical unit at a time
- Update all imports when moving or renaming files
- Update `router/index.ts` if views change
- Update `CompareView.vue` if option metadata changes

### 4. Verify
- Run `npx vue-tsc --noEmit` — must pass with no errors
- Run `npm run lint` — must pass
- Confirm no option views are broken (all routes still resolve)
- Confirm shared components still work across all options that use them

## Common Refactors

| Refactor | Source | Target | Watch Out For |
|----------|--------|--------|---------------|
| Extract shared component | `components/option0X/` | `components/shared/` | Update imports in all options that will use it |
| Consolidate duplicate logic | Multiple option views | Composable in `composables/` | Ensure reactive state still works |
| Rename component | Any component file | Same or new location | Update parent imports, template refs |
| Extract interface/type | Inline in component | `interfaces/` | Update all importing files |
| Reorganize option components | Flat file list | Subdirectories | Update relative imports |

## Rules
- Never change visible behavior during a refactor
- Never modify original UI components (`headers/`, `sidebars/`, `appointments/`, `calendars/`, `actions/`, `footers/`)
- Run type-check after every logical change
- If extracting a shared component, ensure it's themeable via props (see `JumpToDate.vue` pattern)
