---
name: pickup-task
description: Accept and implement a UI-layer plan from the coordinator
user-invocable: true
---

# Pickup Task from Coordinator

You are receiving a plan scoped to the **UI layer**.

## Steps

1. **Read the plan.** User provides it inline or as a file path.
2. **Review conventions.** Re-read `CLAUDE.md` (Vue 3 Composition API, TypeScript, Tailwind, component patterns).
3. **Check contracts.** Read `../patient-care-super/_contracts/` for API response shapes to match.
4. **Check for existing branch:** `git branch -a | grep -E "feature/|fix/"` — reuse if one exists.
5. **Create branch** if needed: `feature/<desc>` or `fix/<desc>`. Never commit to main.
6. **Kanban** — Move related card to DOING:
   ```bash
   curl -s --max-time 2 -X POST http://openclaw:8082/api/move \
     -H "Content-Type: application/json" -d '{"cardId": <ID>, "columnId": 4}'
   ```
7. **Implement.** Only UI-layer steps. Follow existing patterns when referenced.
8. **Verify:**
   ```bash
   cd app-ui && npx vue-tsc --noEmit
   cd app-ui && npm run lint
   ```
9. **Test artifact:** Produce user-facing test scenarios describing workflows to verify.
10. **Commit** with a clear message.
11. **Record completion.** Append to the plan file in `../patient-care-super/planning/active/`:
    ```markdown
    ## Completion — UI
    - **Date**: YYYY-MM-DD
    - **Branch**: `feature/branch-name`
    - **Verification**: vue-tsc: PASS/FAIL | eslint: PASS/FAIL
    - **Files**: N created, M modified
    - **Test artifact**: [test scenarios]
    - **Open items**: None
    ```
    If other layers pending, leave in `active/`. If all done, move to `completed/` + add to `archive.md` (uncommitted).
12. **Report back.** Summarize implementation, verification, and open questions.
