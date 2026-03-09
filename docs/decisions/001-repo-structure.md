# ADR-001: Repository Structure and Claude Code Integration

## Status
Accepted

## Date
2026-03-08

## Context
The `patient-care-ui-vue` repository needed a consistent structure for collaboration with Claude Code, matching the patterns established in the sibling `patient-care-db` and `patient-care-api` repositories. The repo had grown organically with UI design options but lacked:
- A root `CLAUDE.md` for project context
- Structured `.claude/` directory with skills
- A `docs/` directory for architecture and reference documentation

## Decision
Adopt the same directory structure used across other Neurocorp repos:

```
<root>/
├── CLAUDE.md                    # Concise project overview for Claude context
├── .claude/
│   ├── settings.json            # Project identity
│   ├── settings.local.json      # Local permissions
│   ├── hooks/                   # Git/tool hooks (placeholder)
│   ├── prompts/                 # Reusable prompts (placeholder)
│   ├── scripts/                 # Automation scripts (placeholder)
│   ├── tools/                   # Custom tools (placeholder)
│   └── skills/
│       ├── code-review/SKILL.md # Vue/TS/Tailwind review checklist
│       ├── refactor/SKILL.md    # Safe refactoring process
│       └── release/SKILL.md     # Pre-merge validation
├── docs/
│   ├── architecture.md          # System design and layer overview
│   ├── component-reference.md   # Component catalog and interfaces
│   ├── decisions/               # Architectural Decision Records
│   └── runbooks/                # Step-by-step operational guides
```

Skills are tailored to the Vue/TypeScript/Tailwind technology stack rather than copied from the C#/.NET or MySQL repos.

## Consequences
- Claude Code sessions start with clear project context from `CLAUDE.md`
- Skills provide repeatable checklists for reviews, refactoring, and releases
- Documentation lives alongside code and stays current
- Consistent structure across all Neurocorp repos reduces onboarding friction
- Placeholder directories are ready for future hooks, prompts, scripts, and tools
