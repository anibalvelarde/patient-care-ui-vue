---
name: code-review
description: Review Vue/TypeScript code changes for correctness and convention adherence
user-invocable: true
---

# Code Review — UI

## Pre-check
- [ ] Work is on a feature branch, not main

## Architecture & Structure
- [ ] Components in correct directory (`components/option0X/`, `shared/`, or `views/`)
- [ ] `O{N}` prefix for option-specific components
- [ ] New views registered in `router/index.ts`
- [ ] No business logic in templates — use computed/methods in `setup()`

## Vue & TypeScript
- [ ] `defineComponent` with Composition API `setup()` pattern
- [ ] Props typed with `PropType<>`; events declared via `emits`
- [ ] Reactive state uses `ref()` or `computed()`
- [ ] Data fetching via HTTP clients (not direct fetch/axios)
- [ ] No `any` types — proper interfaces used
- [ ] Types match `_contracts/` API response shapes

## Tailwind & Styling
- [ ] All styling via Tailwind utilities (no scoped CSS)
- [ ] Responsive considerations where appropriate
- [ ] Interactive elements have hover/focus states

## General
- [ ] No hardcoded API URLs
- [ ] No console.log in production code
- [ ] Original UI components (`headers/`, `sidebars/`, etc.) untouched
- [ ] Test scenarios provided as test artifact
