# Pick Up Task from Coordinator

Read the active plan files from the coordinator to pick up your portion of a cross-cutting task.

## Steps

1. List available plans:
   ```
   ls ../patient-care-super/planning/active/
   ```

2. Read the plan file(s) to understand:
   - What is the overall goal?
   - What is the **UI layer's** responsibility in this plan?
   - What has already been completed in DB and API layers?

3. Read the coordinator's CLAUDE.md if you need broader context:
   ```
   ../patient-care-super/CLAUDE.md
   ```

4. Check relevant API contracts for the response shapes you need to consume:
   ```
   ../patient-care-super/_contracts/
   ```

5. Summarize what you need to do and confirm with the user before implementing.

## Reminder

You are the **final consumer** in the chain. API changes must land before yours. After implementing, run `npx vue-tsc --noEmit && npm run lint` from `app-ui/` to verify. Follow component naming conventions (`O{N}` prefix) and use Tailwind utility classes.
