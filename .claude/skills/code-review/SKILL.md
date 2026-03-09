# Code Review Skill

## When to Use
When reviewing Vue/TypeScript code changes in this project — new components, modified views, style changes, or service updates.

## Checklist

### Architecture & Structure
- [ ] Components are in the correct directory (`components/option0X/`, `components/shared/`, or `views/`)
- [ ] Component naming follows `O{N}` prefix convention for option-specific components
- [ ] New views are registered in `router/index.ts`
- [ ] New options are added to `CompareView.vue` with a card
- [ ] No business logic in templates — computed properties or methods in `setup()`

### Vue & TypeScript
- [ ] Uses `defineComponent` with Composition API `setup()` pattern
- [ ] Props have correct TypeScript types (`PropType<>` for complex types)
- [ ] Events declared via `emits` option
- [ ] Reactive state uses `ref()` or `computed()`
- [ ] Data fetching uses `SessionsHttpClient` (not direct fetch/axios calls)
- [ ] No `any` types — proper interfaces used (especially `Appointment`)
- [ ] Watchers and lifecycle hooks are appropriate (no unnecessary re-renders)

### Tailwind & Styling
- [ ] All styling via Tailwind utility classes (no inline styles or scoped CSS unless justified)
- [ ] Responsive considerations where appropriate (grid breakpoints, flex-wrap)
- [ ] Color palette consistent within each option's theme
- [ ] Interactive elements have hover/focus/transition states
- [ ] Text sizes use Tailwind scale (no arbitrary pixel values unless necessary)

### Data & State
- [ ] Date handling follows project pattern (`en-US` locale strings, converted in service layer)
- [ ] Appointment data flows via props, not duplicated fetching
- [ ] Selected state managed at view level, passed down as props
- [ ] Error states handled (empty data, fetch failures)

### General
- [ ] No hardcoded API URLs (uses `SessionsHttpClient` which reads env var)
- [ ] No console.log left in production code (console.error for caught exceptions is OK)
- [ ] "Back to Options" router-link present on every option view
- [ ] No breaking changes to existing options or shared components
- [ ] `UI-DESIGN-IDEAS.md` updated if a new option is added
