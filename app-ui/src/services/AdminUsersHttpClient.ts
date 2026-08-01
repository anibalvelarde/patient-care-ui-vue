// services/AdminUsersHttpClient.ts — WP-41 (SA-only v1)
//
// Admin user management (operator accounts only). Reads ride Admin.Users.View (MGR+OWN),
// writes ride Admin.Users.Manage (SYSADMIN-only). Guard-rail 400s arrive as ProblemDetails
// whose `detail` is an actionable message — HttpClientBase surfaces it verbatim as
// Error.message, so callers just render the caught message.

import { HttpClientBase } from './HttpClientBase';
import type { PagedResult } from '../interfaces/SessionHistory';
import type { AdminUserSummary, AdminUserCreateRequest, AdminUserUpdateRequest } from '../interfaces/AdminUsers';

/** Query shape for the paged operator list (WP-30 rule / WP-21 envelope). */
export interface AdminUsersQuery {
  search?: string;
  page?: number;
  pageSize?: number;
}

export class AdminUsersHttpClient extends HttpClientBase {
  /** Paged operator list; search = case-insensitive contains on name/email. pageSize capped at 100 server-side. */
  async getUsers(query: AdminUsersQuery = {}): Promise<PagedResult<AdminUserSummary>> {
    const params = new URLSearchParams({ page: String(query.page ?? 1), pageSize: String(query.pageSize ?? 25) });
    if (query.search?.trim()) params.set('search', query.search.trim());
    return this.get<PagedResult<AdminUserSummary>>(`/api/admin/users?${params.toString()}`);
  }

  /** 404 when the user does not exist OR holds no operator role (out of v1 scope). */
  async getUser(id: number): Promise<AdminUserSummary> {
    return this.get<AdminUserSummary>(`/api/admin/users/${id}`);
  }

  /** 201 + summary; duplicate email → 409 with a clean message. */
  async createUser(data: AdminUserCreateRequest): Promise<AdminUserSummary> {
    return this.post<AdminUserSummary>('/api/admin/users', data);
  }

  /** 204; omitted field = unchanged. Guard-rail 400s (self-deactivate/self-demote/last-SYSADMIN/empty roles). */
  async updateUser(id: number, data: AdminUserUpdateRequest): Promise<void> {
    return this.put(`/api/admin/users/${id}`, data);
  }

  /** 204; sets the temp password + mustChangePassword=true (next login forces the change flow). */
  async resetPassword(id: number, tempPassword: string): Promise<void> {
    return this.post<void>(`/api/admin/users/${id}/reset-password`, { tempPassword });
  }
}
