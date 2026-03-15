# ADR-002: UI Alert Color Conventions

## Status
Accepted

## Context
As the patient care UI grows, we need consistent color conventions for alert states across components. Without a shared standard, different developers may use conflicting colors for similar states, confusing front-desk staff.

## Decision
We adopt the following Tailwind color conventions for semantic UI states:

### Amber — "Needs Attention"
- **Classes**: `bg-amber-100 text-amber-700`, `bg-amber-50 border-amber-300`
- **Usage**: Temporary MRN badges, delinquent patient tab, warning banners, highlighted sessions from deep links
- **Highlight ring**: `ring-2 ring-amber-400 bg-amber-50`

### Green — Positive / Active Status
- **Classes**: `bg-green-100 text-green-700`
- **Usage**: Active status badges, paid-off session indicators

### Slate — Neutral / Inactive Status
- **Classes**: `bg-slate-100 text-slate-500`
- **Usage**: Inactive status badges, disabled controls, secondary text

### Red — Error States
- **Classes**: `bg-red-50 text-red-700`
- **Usage**: API failures, validation errors, past-due session rows

### Blue — Interactive / Focus States
- **Classes**: `ring-blue-500`, `text-blue-600`, `bg-blue-600` (buttons)
- **Usage**: Focused inputs, clickable links, primary action buttons, sort indicators

## Consequences
- All new UI components should follow these conventions
- Existing components already conform (temp-MRN badges, status badges, error states)
- The delinquent tab uses amber to align with the "needs attention" pattern
