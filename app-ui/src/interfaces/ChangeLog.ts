// interfaces/ChangeLog.ts — WP-54C (SYSADMIN entity change log)
//
// Shapes mirror _contracts/admin-change-log-api.md. FIELD NAMES ONLY — no before/after values
// (owner ruling G2): a row carries `changedFields: string[]`, never any value.

export type ChangeAction = 'Insert' | 'Update' | 'Delete';
export type ChangeLogGroupBy = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface ChangeLogUser {
  userId: number;
  displayName: string;
}

export interface ChangeLogEntry {
  id: number;
  occurredAtUtc: string;
  user: ChangeLogUser;
  entityType: string;
  entityId: string;
  entityLabel: string | null;
  action: ChangeAction;
  changedFields: string[];
  correlationId: string | null;
}

export interface ChangeLogTotals {
  inserts: number;
  updates: number;
  deletes: number;
  total: number;
  distinctUsers: number;
  distinctEntities: number;
}

export interface ChangeLogUserCount {
  userId: number;
  displayName: string;
  inserts: number;
  updates: number;
  deletes: number;
  total: number;
  lastOccurredAtUtc: string;
}

export interface ChangeLogEntityTypeCount {
  entityType: string;
  inserts: number;
  updates: number;
  deletes: number;
  total: number;
  lastOccurredAtUtc: string;
}

export interface ChangeLogPeriodCount {
  periodStart: string;
  label: string;
  inserts: number;
  updates: number;
  deletes: number;
  total: number;
}

export interface ChangeLogSummary {
  fromUtc: string;
  toUtc: string;
  groupBy: ChangeLogGroupBy;
  tzOffsetMinutes: number;
  totals: ChangeLogTotals;
  byUser: ChangeLogUserCount[];
  byEntityType: ChangeLogEntityTypeCount[];
  byPeriod: ChangeLogPeriodCount[];
  byPeriodOmitted: boolean;
}

export interface ChangeLogEntityTypeInfo {
  entityType: string;
  displayName: string;
}

/** Filter state shared by the summary + list queries. */
export interface ChangeLogQuery {
  fromUtc: string;
  toUtc: string;
  tzOffsetMinutes: number;
  groupBy: ChangeLogGroupBy;
  userId?: number | null;
  entityType?: string | null;
  entityId?: string | null;
  action?: ChangeAction | null;
  correlationId?: string | null;
  page?: number;
  pageSize?: number;
}
