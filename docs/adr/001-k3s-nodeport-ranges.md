# ADR-001: K3s NodePort Range Convention

## Status
Superseded (updated)

## Context
The Neurocorp project deploys multiple services to a local LAN K3s cluster. Without a convention, NodePort assignments become ad hoc and harder to manage as services grow.

Kubernetes limits NodePort to the default range **30000–32767**. The original plan to use 40000+ for UI apps is not possible without reconfiguring the cluster.

## Decision
Reserve NodePort sub-ranges within the valid Kubernetes range by service type:

| Range | Service Type | Example |
|-------|-------------|---------|
| **30000–30499** | REST API services | `patient-care-api` → 30000 |
| **31000–31499** | UI / SPA applications | `patient-care-ui-vue` → 31000 |

## Consequences
- New REST APIs should pick the next available port in the 30000–30499 range.
- New UI/SPA apps should pick the next available port in the 31000–31499 range.
- Helm `values.yaml` defaults should reflect this convention.
- Developers can quickly identify a service's type from its port number.
