# Pickup Task from Coordinator

You are receiving an implementation plan from the **coordinator instance** (`patient-care-super`). This plan was created after cross-project analysis and describes work scoped to the **UI layer**.

## Instructions

1. **Read the plan.** The user will provide it — either pasted inline or as a file path. Read the full plan carefully.
2. **Review your conventions.** Re-read `CLAUDE.md` in this repo to ensure you follow UI project conventions (Vue 3 Composition API, TypeScript, Tailwind CSS, component patterns).
3. **Check contracts.** If the plan references `_contracts/` files in the coordinator repo, read them to understand the API request/response shapes your service clients must match.
4. **Create a feature branch.** Use the branch name specified in the plan, or derive one from the task (e.g., `feature/<short-description>`). Never commit directly to main.
5. **Implement.** Execute only the UI-layer steps from the plan. Do not attempt work designated for DB or API layers.
6. **Follow existing patterns.** When the plan says "pattern reference: `SomeComponent.vue`", read that file first and replicate its structure, styling, and conventions.
7. **Verify.** Run the verification steps specified in the plan. At minimum:
   ```bash
   cd app-ui && npx vue-tsc --noEmit
   cd app-ui && npm run lint
   ```
8. **Commit.** Stage and commit your changes with a clear message describing what was done.
9. **Report back.** Summarize what you implemented, what you verified, and any issues or open questions for the coordinator.

## Important

- Only implement work scoped to this layer (views, components, services, interfaces, routing).
- If the plan references DB or API work, ignore those sections — other specialist instances handle them.
- If something in the plan is unclear or seems wrong, ask the user before proceeding.
