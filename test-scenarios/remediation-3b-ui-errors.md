# Test Scenarios — Remediation 2026 Chunk 3B (UI Centralized Error Handling)

Branch: `feature/remediation-2026-3b-ui-errors`

## What changed
- **`useFormError()` composable** + **`<FormErrorBanner>`** — centralizes the per-form error pattern
  (local `error` ref + `e.message` extraction + red banner + "disable save while error"). Forms keep
  their own local error state; only the boilerplate is shared.
- **`notifications` Pinia store** + **`<GlobalErrorToast>`** (mounted once in `App.vue`) — app-level
  transient toasts for cross-cutting messages.
- **Auth integration**: a real session expiry (401 with no recoverable refresh) now shows a global
  toast "Your session has expired. Please sign in again." on redirect to login.
- **Reference migrations**: `PatientFormModal` (modal) and `PatientsView` (view) now use the new
  mechanism — with **identical UX** to before (same inline red banner, same disable-save behavior).

## Prerequisites
- API (1B/3A) on `http://neurocorp.k3s:30000`; UI dev server `npm run dev` → `http://localhost:8080`.
- Logged in (see 1C scenarios).

## Scenarios

### 1. Form error banner still works (PatientFormModal) — no UX regression
1. Patients → Add Patient. Submit with a required field blank.
2. **Expect:** red banner "Please fill in all required fields." in the modal footer; **Save disabled**
   while the banner shows; editing a field clears it. (Same as before — now powered by `useFormError`.)

### 2. API error surfaces in the form banner
1. Trigger a server-side rejection (e.g. duplicate email on create).
2. **Expect:** the banner shows the API's `ProblemDetails.detail` message (via `HttpClientBase` →
   `e.message` → `setFromException`). Save disabled until corrected.

### 3. View-level error (PatientsView)
1. Stop the API (or simulate a failed load) and open Patients.
2. **Expect:** the existing inline error surface shows "Failed to load patients." (now via
   `useFormError`, same display).

### 4. Global toast on session expiry
1. While logged in, invalidate the session (clear `pc_refresh_token` in localStorage and let the
   access token expire, or stop the API key) and trigger any API call.
2. **Expect:** redirect to `/login` **and** a red toast top-right: "Your session has expired. Please
   sign in again.", auto-dismissing after a few seconds (dismissable via ×).
3. A failed **login attempt** (wrong password) must **not** trigger the global toast (only the login
   form's own error) — the toast is for expiry of an *authenticated* session.

## Automated checks
- `npx vue-tsc --noEmit` — clean.
- `npm run lint` — clean.
- `npm run build` — succeeds.

## Not in scope (tracked follow-up)
The remaining ~33 views/modals still use local `error` refs. Migrating them to `useFormError` /
`<FormErrorBanner>` is a tracked follow-up sweep (see the 3B sub-plan Completion section).
