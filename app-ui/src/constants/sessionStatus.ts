// WP-56C — the ONE home for appointment/session status values in the SPA.
// Mirrors the API's `SessionStatus` (patient-care-api src/Core/Services/SessionStatus.cs, WP-55B):
// ids are the AppointmentStatus lookup PKs, names are the wire `statusName` strings.
// Guarded by __tests__/wp56-constants-lockstep.spec.ts — change a value here and there together.

export const SessionStatus = {
  Proposed: 1,
  Confirmed: 2,
  Cancelled: 3,
  Completed: 4,
  NoShow: 5,
  CheckedIn: 6,
  InTherapy: 7,
} as const;

export type SessionStatusId = (typeof SessionStatus)[keyof typeof SessionStatus];

export const SessionStatusName = {
  Proposed: 'Proposed',
  Confirmed: 'Confirmed',
  Cancelled: 'Cancelled',
  Completed: 'Completed',
  NoShow: 'NoShow',
  CheckedIn: 'CheckedIn',
  InTherapy: 'InTherapy',
} as const;

export type SessionStatusNameValue = (typeof SessionStatusName)[keyof typeof SessionStatusName];

export const SESSION_STATUS_ID_TO_NAME: Readonly<Record<SessionStatusId, SessionStatusNameValue>> = {
  [SessionStatus.Proposed]: SessionStatusName.Proposed,
  [SessionStatus.Confirmed]: SessionStatusName.Confirmed,
  [SessionStatus.Cancelled]: SessionStatusName.Cancelled,
  [SessionStatus.Completed]: SessionStatusName.Completed,
  [SessionStatus.NoShow]: SessionStatusName.NoShow,
  [SessionStatus.CheckedIn]: SessionStatusName.CheckedIn,
  [SessionStatus.InTherapy]: SessionStatusName.InTherapy,
};

// Sets — CONFIRMED/ACTIVE mirror the API's ConfirmedStatuses / ActiveStatuses; TERMINAL/NOT_HELD
// are UI groupings.
export const CONFIRMED_STATUSES: readonly SessionStatusId[] = [
  SessionStatus.Confirmed, SessionStatus.Completed, SessionStatus.CheckedIn, SessionStatus.InTherapy,
];
export const ACTIVE_STATUSES: readonly SessionStatusId[] = [
  SessionStatus.Proposed, SessionStatus.Confirmed, SessionStatus.CheckedIn, SessionStatus.InTherapy,
];
/** No further status transitions are offered once a session is here (ActionsPanel). */
export const TERMINAL_STATUSES: readonly SessionStatusId[] = [
  SessionStatus.Cancelled, SessionStatus.Completed, SessionStatus.NoShow,
];
/** The session did not happen — Cancelled or NoShow (dashboard "cancelled" bucket, list filter). */
export const NOT_HELD_STATUSES: readonly SessionStatusId[] = [
  SessionStatus.Cancelled, SessionStatus.NoShow,
];

/**
 * Appointments-list filter token for the NOT_HELD bucket. Crosses components: the dashboard
 * Cancelled tile links `/appointments?filter=cancelled` → AppointmentsView → AppointmentsList.
 * Lower-case on purpose so it can never collide with a wire `statusName`. Do not change the value
 * without updating bookmarked/linked URLs.
 */
export const APPOINTMENT_FILTER_NOT_HELD = 'cancelled';

export function isNotHeld(statusId: number): boolean {
  return (NOT_HELD_STATUSES as readonly number[]).includes(statusId);
}

export function isTerminalStatus(statusId: number): boolean {
  return (TERMINAL_STATUSES as readonly number[]).includes(statusId);
}

// ── Presentation (folded from utils/statusHelpers.ts — WP-56 G3) ─────────────────────────────

/** Human label per wire status name; unknown (admin-added) names pass through unchanged. */
export const SESSION_STATUS_LABEL: Readonly<Record<SessionStatusNameValue, string>> = {
  Proposed: 'Proposed',
  Confirmed: 'Confirmed',
  Cancelled: 'Cancelled',
  Completed: 'Completed',
  NoShow: 'No Show',
  CheckedIn: 'Checked In',
  InTherapy: 'In Therapy',
};

const BADGE_CLASS: Readonly<Record<SessionStatusId, string>> = {
  [SessionStatus.Proposed]: 'bg-amber-100 text-amber-800',
  [SessionStatus.Confirmed]: 'bg-green-100 text-green-800',
  [SessionStatus.Cancelled]: 'bg-slate-100 text-slate-600',
  [SessionStatus.Completed]: 'bg-gray-100 text-gray-600',
  [SessionStatus.NoShow]: 'bg-red-100 text-red-800',
  [SessionStatus.CheckedIn]: 'bg-blue-100 text-blue-800',
  [SessionStatus.InTherapy]: 'bg-purple-100 text-purple-800',
};

const DOT_COLOR: Readonly<Record<SessionStatusId, string>> = {
  [SessionStatus.Proposed]: 'bg-amber-400',
  [SessionStatus.Confirmed]: 'bg-green-400',
  [SessionStatus.Cancelled]: 'bg-slate-400',
  [SessionStatus.Completed]: 'bg-gray-400',
  [SessionStatus.NoShow]: 'bg-red-400',
  [SessionStatus.CheckedIn]: 'bg-blue-400',
  [SessionStatus.InTherapy]: 'bg-purple-400',
};

/**
 * Treatment-plan progress list (PlanProgressCard) — a deliberately DIFFERENT, text-only palette
 * (Proposed is blue here, amber in badges). Kept separate on purpose: unifying it with BADGE_CLASS
 * would be a visible change. Only the four statuses that list styles are mapped; others → slate.
 */
const PLAN_PROGRESS_TEXT_CLASS: Readonly<Partial<Record<SessionStatusId, string>>> = {
  [SessionStatus.Proposed]: 'text-blue-600',
  [SessionStatus.Confirmed]: 'text-emerald-600',
  [SessionStatus.Cancelled]: 'text-red-500',
  [SessionStatus.Completed]: 'text-gray-600',
};

export function getStatusBadgeClass(appointmentStatusId: number): string {
  return BADGE_CLASS[appointmentStatusId as SessionStatusId] ?? 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(statusName: string): string {
  return SESSION_STATUS_LABEL[statusName as SessionStatusNameValue] || statusName;
}

export function getStatusDotColor(appointmentStatusId: number): string {
  return DOT_COLOR[appointmentStatusId as SessionStatusId] ?? 'bg-gray-400';
}

export function getPlanProgressStatusClass(statusId: number): string {
  return PLAN_PROGRESS_TEXT_CLASS[statusId as SessionStatusId] ?? 'text-slate-500';
}
