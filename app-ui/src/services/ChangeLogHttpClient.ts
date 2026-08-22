// services/ChangeLogHttpClient.ts — WP-54C (SYSADMIN entity change log)
//
// Read-only client for /api/admin/change-log. There is deliberately NO purge method: the purge
// endpoint (DELETE) is API-only and never called from the UI (owner ruling D13).

import { HttpClientBase } from './HttpClientBase';
import type { PagedResult } from '../interfaces/SessionHistory';
import type {
  ChangeLogEntry,
  ChangeLogSummary,
  ChangeLogEntityTypeInfo,
  ChangeLogQuery,
} from '../interfaces/ChangeLog';

function summaryParams(q: ChangeLogQuery): URLSearchParams {
  const p = new URLSearchParams({
    from: q.fromUtc,
    to: q.toUtc,
    tzOffsetMinutes: String(q.tzOffsetMinutes),
    groupBy: q.groupBy,
  });
  if (q.userId != null) p.set('userId', String(q.userId));
  if (q.entityType) p.set('entityType', q.entityType);
  if (q.action) p.set('action', q.action);
  return p;
}

export class ChangeLogHttpClient extends HttpClientBase {
  /** Macro view: totals, by-user (lead), by-entity-type, and the period trend. */
  async getSummary(query: ChangeLogQuery): Promise<ChangeLogSummary> {
    return this.get<ChangeLogSummary>(`/api/admin/change-log/summary?${summaryParams(query).toString()}`);
  }

  /** Paged detail list, newest first (WP-21 envelope). */
  async list(query: ChangeLogQuery): Promise<PagedResult<ChangeLogEntry>> {
    const p = new URLSearchParams({
      from: query.fromUtc,
      to: query.toUtc,
      page: String(query.page ?? 1),
      pageSize: String(query.pageSize ?? 25),
    });
    if (query.userId != null) p.set('userId', String(query.userId));
    if (query.entityType) p.set('entityType', query.entityType);
    if (query.entityId) p.set('entityId', query.entityId);
    if (query.action) p.set('action', query.action);
    if (query.correlationId) p.set('correlationId', query.correlationId);
    return this.get<PagedResult<ChangeLogEntry>>(`/api/admin/change-log?${p.toString()}`);
  }

  /** Static list of audited entity types (stable filter chips). */
  async getEntityTypes(): Promise<ChangeLogEntityTypeInfo[]> {
    return this.get<ChangeLogEntityTypeInfo[]>('/api/admin/change-log/entity-types');
  }
}
