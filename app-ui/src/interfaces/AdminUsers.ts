// interfaces/AdminUsers.ts — WP-41 (SA-only v1)
//
// Wire shapes for /api/admin/users (contract: patient-care-super/_contracts/admin-users-api.md).
// v1 surfaces OPERATOR accounts only — SystemUsers holding at least one non-identity role.
// Identity roles (Patient/Therapist/Caretaker) are informational here and never editable.

/** One manageable (non-identity) role on an operator account. */
export interface OperatorRole {
  roleTypeId: number;
  name: string;
}

/** GET/POST response shape. `email` is the login (there is no username — WP-22 lesson). */
export interface AdminUserSummary {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  mustChangePassword: boolean;
  operatorRoles: OperatorRole[];
  /** Informational names only — display "also a Patient" hints; never editable here. */
  identityRoles: string[];
}

/**
 * POST /api/admin/users — account is created ACTIVE with mustChangePassword=true (G3:
 * temp password + forced change at next login). Identity role ids in the list → 400.
 */
export interface AdminUserCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  tempPassword: string;
  operatorRoleTypeIds: number[];
}

/**
 * PUT /api/admin/users/{id} — omitted/undefined field = unchanged. `operatorRoleTypeIds`
 * REPLACES the operator-role set (identity links untouched); empty list → 400 (guard rail).
 */
export interface AdminUserUpdateRequest {
  operatorRoleTypeIds?: number[];
  isActive?: boolean;
}
