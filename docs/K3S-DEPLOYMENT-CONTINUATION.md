# K3s Deployment — Session Continuation Prompt

> **Purpose:** Pick up exactly where we left off. Feed this file to Claude Code to resume work.

## Goal

Dockerize and deploy the Vue 3 SPA (`patient-care-ui-vue`) to the local LAN K3s cluster, following the same pattern used by the REST API at `/c/working/customers/neurocorp/patient-care-api/`.

## Decisions Made

| # | Question | Decision |
|---|----------|----------|
| 1 | **NodePort for SPA** | **31000** — UI apps use the 31000–31499 range; REST APIs use the 30000–30499 range (see ADR below) |
| 2 | **API URL at runtime** | Sourced from `VITE_API_BASE_URL` environment variable, injected at container startup via entrypoint script. The Docker image is environment-agnostic. |
| 3 | **Docker Hub image** | `anibalvelarde/patient-care-ui-vue` (same Docker Hub account as the API) |
| 4 | **Namespace** | `nc-k3s` (same namespace as the API) |
| 5 | **CI/CD** | GitHub Actions from the start (same pattern as the API repo's `.github/workflows/main.yaml`) |

## Port Range Convention (ADR)

- **30000–30499** — REST API services (e.g., `patient-care-api` on 30000)
- **31000–31499** — UI/SPA applications (e.g., `patient-care-ui-vue` on 31000)

This convention should be documented in project docs and enforced in Helm `values.yaml` defaults.

## Reference: API Deployment Pattern (to replicate)

The REST API at `/c/working/customers/neurocorp/patient-care-api/` uses:

```
build/
  Dockerfile              # Multi-stage: SDK build → ASP.NET runtime
  startup_scripts/
    startup.sh            # Env-based port selection, launches dotnet

deploy/helm/patient-care-api/
  Chart.yaml              # Helm v2 chart, app version 1.0.0
  values.yaml             # replicaCount, image, service (NodePort 30000), namespace nc-k3s, healthChecks
  deploy.sh               # Reads .env, runs helm upgrade --install
  .env.example            # Template for DB credentials
  templates/
    deployment.yaml       # Deployment with liveness/readiness/startup probes
    service.yaml          # NodePort service (80 → 5245, nodePort 30000)
    namespace.yaml        # Creates nc-k3s namespace
    secret.yaml           # DB credentials as K8s Secret
    _helpers.tpl          # Helm template helpers
    NOTES.txt             # Post-deploy instructions

.github/workflows/
  main.yaml               # Push to main → build, test, Docker push (anibalvelarde/patient-care-api:latest + :build-number)
  pr-validation.yaml      # PR → build & test only (no Docker push)
```

## What Needs to Be Built (implementation plan)

### 1. Dockerfile (`build/Dockerfile`)
- **Stage 1 (build):** `node:20-alpine` → copy `app-ui/`, `npm install`, validate `VITE_API_BASE_URL` is set (fail if missing), `npm run build` → produces `dist/`
- **Stage 2 (runtime):** `nginx:alpine` → copy `dist/` to `/usr/share/nginx/html/`, copy custom nginx config
- Custom nginx config handles SPA routing: all non-file routes → `index.html`
- Build arg: `VITE_API_BASE_URL` (required), `BUILD_VERSION` (optional)

### 2. Nginx Config (`build/nginx/default.conf`)
- Serve static files from `/usr/share/nginx/html/`
- `try_files $uri $uri/ /index.html` for SPA client-side routing
- Gzip compression for JS/CSS/HTML
- Cache headers for static assets

### 3. Helm Chart (`deploy/helm/patient-care-ui-vue/`)
- `Chart.yaml` — chart metadata
- `values.yaml` — image: `anibalvelarde/patient-care-ui-vue:latest`, service: NodePort 31000, namespace: `nc-k3s`
- `templates/deployment.yaml` — Deployment (nginx container, port 80)
- `templates/service.yaml` — NodePort (80 → 80, nodePort 31000)
- `templates/namespace.yaml` — `nc-k3s` (same as API, idempotent)
- `templates/_helpers.tpl` — Helm helpers
- `templates/NOTES.txt` — Post-deploy access instructions
- No secrets needed (no DB); API URL is baked in at build time

### 4. Deploy Script (`deploy/helm/patient-care-ui-vue/deploy.sh`)
- Same pattern as API's deploy.sh
- Runs `helm upgrade --install`
- Accepts optional image tag argument

### 5. Environment File (`deploy/helm/patient-care-ui-vue/.env.example`)
```
VITE_API_BASE_URL=http://192.168.1.100:30000
```

### 6. GitHub Actions (`.github/workflows/`)
- `main.yaml` — Push to main → npm install, build, Docker build+push (`anibalvelarde/patient-care-ui-vue:latest` + `:build-number`)
- `pr-validation.yaml` — PR → npm install, type-check, lint (no Docker push)
- Docker Hub credentials via GitHub Secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`

## Important Notes

- `VITE_API_BASE_URL` is a **build-time** variable (Vite bakes env vars into the bundle). It must be set when `npm run build` runs inside Docker. This means the Docker image is environment-specific (the API URL is embedded in the JS bundle).
- The SPA runs in the **browser**, so the API URL must be reachable from the user's machine on the LAN, not from inside the K3s cluster.
- Original UI components (`headers/`, `sidebars/`, etc.) remain untouched.
- The app source lives under `app-ui/` (not the repo root).

## Resume Command

Open Claude Code in the repo root and say:

> Read `docs/K3S-DEPLOYMENT-CONTINUATION.md` and proceed with implementing the K3s deployment for the SPA. Start with step 1 (Dockerfile) and work through all 6 steps.
