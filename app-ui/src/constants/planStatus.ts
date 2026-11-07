// WP-56C — treatment-plan status values (the `planStatus` wire string). The `PlanStatus` TYPE in
// interfaces/TreatmentPlan.ts is derived from this object so existing imports keep working.

export const PlanStatus = {
  Draft: 'Draft',
  Active: 'Active',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
} as const;

export type PlanStatusValue = (typeof PlanStatus)[keyof typeof PlanStatus];

export const ALL_PLAN_STATUSES: readonly PlanStatusValue[] = Object.values(PlanStatus);

/** Filter tabs on the treatment-plan list / view: `All` + every status, in display order. */
export const PLAN_STATUS_TABS: readonly string[] = ['All', ...ALL_PLAN_STATUSES];
