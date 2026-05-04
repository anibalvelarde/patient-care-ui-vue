# WP-15C — UI Version Display: User Test Scenarios

**Branch:** `feature/wp-15c-ui-version`
**Companion plan:** `patient-care-super/planning/active/wp-15-ui-version-display.md`

---

## Scenario 1 — Footer badge in local dev

**Setup:** `cd app-ui && npm run dev`. Open `http://localhost:8080`.

**Expected on the production layout footer (Option02 — applies to all main app routes):**
- Footer shows three segments separated by `|`:
  `UI dev | API {server-version} | {Healthy|Degraded|Unhealthy} | As of {timestamp}`
- The `UI dev` part is grey, same styling as the rest of the badge.
- No network call is made for the UI version (DevTools → Network → no extra request beyond the existing `/api/health/checks`).

---

## Scenario 2 — Admin About panel in local dev

**Setup:** Same as scenario 1. Navigate to `/admin`.

**Expected:**
- The accordion now has four groups: Configuration · Reference Data · Security · **About**.
- Click **About** → it expands and shows one item: **Build Info**.
- Click **Build Info** → right pane renders three rows:
  - `UI`: `dev (a1b2c3d)` where `a1b2c3d` is the short SHA of the local working git HEAD.
  - `API`: the same version string the footer shows (e.g., `88.0.0.0`), or `unavailable` if the API is down.
  - `Built`: a timestamp roughly equal to the `vite` config-eval moment.
- The values are `font-mono`-styled, dt labels are slate-600, and dividers separate rows.

---

## Scenario 3 — Footer badge after a CI build

**Setup:** Merge this branch to `main` so GitHub Actions builds and deploys the SPA. Hard-refresh `https://neurocorp.anibalvelarde.com` (Ctrl+Shift+R or incognito) to bypass cached assets.

**Expected:**
- Footer shows `UI v{N}` where `{N}` is the GitHub Actions run number for that build (e.g., `UI v90`).
- The number is one greater than the previous deployed run (assuming no intermediate runs).
- The API portion of the badge still works as before.

---

## Scenario 4 — Admin About panel after a CI build

**Setup:** Same as scenario 3. Navigate to `/admin` → About → Build Info on the live site.

**Expected:**
- `UI` row shows `v{N} ({short_sha})` where `{short_sha}` is the first 7 characters of the merged commit SHA.
- The short SHA matches the merge commit on `main` (verifiable with `git log --oneline main -1`).
- `Built` row shows the head-commit timestamp from the CI run.

---

## Scenario 5 — Stale-deployment detection

**Setup:** After a deploy completes, immediately re-load the SPA. Then merge a no-op commit to `main`, wait for CI, and reload again *without* clearing the browser cache.

**Expected (the diagnostic value of this feature):**
- If the browser served cached `index.html`, the footer still shows the previous `v{N}`. Hard-refresh updates it.
- If the user reports a UI bug, the footer/About number tells you exactly which commit is running so you can `git show <sha>` and reproduce.

---

## Scenario 6 — API down

**Setup:** Block `/api/health/checks` (e.g., temporarily kill the API or use DevTools to throttle/error the request). Reload the page and the Admin About panel.

**Expected:**
- Footer: `UI v{N}` still renders (it's not network-dependent). The API portion of the badge shows `API Unavailable`.
- Admin About panel: `UI` and `Built` rows render normally; `API` row shows `unavailable` in italic grey.
