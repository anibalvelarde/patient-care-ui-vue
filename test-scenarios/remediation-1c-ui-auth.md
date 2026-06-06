# Test Scenarios — Remediation 2026 Chunk 1C (UI Authentication & Claims-Aware Behavior)

Branch: `feature/remediation-2026-1c-ui-auth`

## Prerequisites
- API (1B) running on `http://localhost:5245`, DB migrated (V017) and SA bootstrapped.
- UI dev server: `cd app-ui && npm run dev` → `http://localhost:8080`.
- An SA account (e.g. `anibalvelarde+sa@gmail.com`) and a non-SA account (e.g. `anibalvelarde+tester@gmail.com`).

---

## 1. Unauthenticated users are redirected to login
1. With no active session, open `http://localhost:8080/patients` (or any route).
2. **Expect:** immediate redirect to `/login`. No patient data is fetched.

## 2. Successful login
1. On `/login`, enter valid SA credentials and submit.
2. **Expect:** redirect to the dashboard (`/`); data loads; the header shows the user's initials + full name.

## 3. Invalid credentials
1. On `/login`, enter a wrong password.
2. **Expect:** inline error "Invalid email or password." (generic — same for unknown emails). No redirect.

## 4. Token is attached to API calls
1. After logging in, navigate to Patients / Therapists / etc.
2. **Expect:** lists load normally (the access token is attached automatically). In dev tools, requests carry `Authorization: Bearer …`.

## 5. Session survives a page reload (silent refresh)
1. While logged in, hard-refresh the browser.
2. **Expect:** you remain logged in and land on the same page — the app silently re-mints an access token from the stored refresh token. (The access token itself is only in memory; the refresh token is in `localStorage` as `pc_refresh_token`.)

## 6. Logout
1. Click the sign-out button in the header.
2. **Expect:** redirect to `/login`; `pc_refresh_token` is cleared; navigating back to a protected route redirects to `/login`.

## 7. Must-change-password gate (server-enforced)
1. In the DB, set `MustChangePassword = 1` for the test user; log in as them.
2. **Expect:** you are routed to `/change-password` and cannot reach any other route until the password is changed. (Any direct API call also returns 403 `password_change_required`, which the app intercepts and redirects.)
3. Submit current + a new password (≥ 8 chars, different from current, matching confirmation).
4. **Expect:** success → redirect to dashboard; subsequent navigation is unrestricted.

## 8. Admin area is SystemAdmin-only
1. Log in as the **SA** → the **Admin** (gear) item is visible in the sidebar; `/admin` loads.
2. Log out, log in as the **non-SA** user → the **Admin** item is **hidden**; manually visiting `/admin` redirects to the dashboard.

## 9. Claims-aware nav (forward-looking)
- All authenticated users currently see the full business nav, because only the SA wildcard claim is seeded today (the granular `RoleClaim` catalogue is deferred). Nav items support an optional `claim` binding (`O2Sidebar`), so once granular claims are seeded, gating an item requires only adding its claim — no component changes. Verify the SA still sees everything and non-SA sees everything except Admin.

## 10. 401 mid-session handling
1. While logged in, simulate an expired/invalid token (e.g. clear the refresh token and let the access token expire, or stop/restart the API key).
2. **Expect:** the next API call attempts a silent refresh; if it fails, the app logs out and redirects to `/login` with a clear message.

---

## Automated checks
- `npx vue-tsc --noEmit` — clean.
- `npm run lint` — clean.
- `npm run build` — succeeds (LoginView/ChangePasswordView emitted as chunks).
