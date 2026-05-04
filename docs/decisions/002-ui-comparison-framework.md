# ADR-002: UI Design Comparison Framework

## Status
**Superseded** by Option 02 selection (2026-03-14) and dismantled by WP-16C (2026-05-04). See ADR-003 for the original Option 01 pick and the subsequent switch to Option 02; see WP-16C plan in `patient-care-super/planning/completed/wp-16-design-option-cleanup.md` for the cleanup that removed the comparison framework from the codebase.

This ADR is preserved as the historical record of the comparison framework's original design.

## Original Status (2026-03-08)
Accepted

## Date
2026-03-08

## Context
The Neurocorp Therapy Center needed a new UI for its patient care front-desk application. Rather than committing to a single design upfront, the team wanted to explore multiple structurally distinct layout patterns and compare them side-by-side before making a final selection.

## Decision
Implement all design options on a **single branch** as separate routes within the same Vue application:
- Each option gets its own route (`/option-01` through `/option-07`)
- A landing page at `/` presents all options as clickable cards for easy comparison
- The original UI is preserved at `/current`
- All options share the same data layer (`SessionsHttpClient`, `Appointment` interface)
- Each option has its own component directory (`components/option0X/`) to avoid cross-contamination

## Consequences
- Stakeholders can compare options in a single running app without switching branches
- Shared data layer ensures all options display the same real data
- Component isolation prevents design decisions in one option from leaking into another
- The approach scales to additional options without structural changes
- Once a design is selected, unused options can be removed cleanly
- Trade-off: the bundle includes all options, but this is a dev/comparison tool, not a production concern
