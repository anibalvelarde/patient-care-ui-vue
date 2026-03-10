# ADR-001: K3s NodePort Range Convention

## Status
Accepted

## Context
The Neurocorp project deploys multiple services to a local LAN K3s cluster. Without a convention, NodePort assignments become ad hoc and harder to manage as services grow.

## Decision
Reserve NodePort ranges by service type:

| Range | Service Type | Example |
|-------|-------------|---------|
| **30000–30999** | REST API services | `patient-care-api` → 30000 |
| **40000–40999** | UI / SPA applications | `patient-care-ui-vue` → 40000 |

## Consequences
- New REST APIs should pick the next available port in the 30000 range.
- New UI/SPA apps should pick the next available port in the 40000 range.
- Helm `values.yaml` defaults should reflect this convention.
- Developers can quickly identify a service's type from its port number.
