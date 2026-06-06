// interfaces/Auth.ts
// Shapes for the /api/auth surface. Source of truth: patient-care-super/_contracts/auth-api.md.

/** The god-mode wildcard claim: ("System", "FullAccess"), granted only to SystemAdmins. */
export const SYSTEM_CLAIM_TYPE = 'System';
export const SYSTEM_FULL_ACCESS = 'FullAccess';

/** A single authorization claim (type + value), e.g. { type: "System", value: "FullAccess" }. */
export interface ClaimDto {
  type: string;
  value: string;
}

/** Request body for POST /api/auth/login. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Request body for POST /api/auth/change-password. */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** Returned by login / refresh / change-password. */
export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  mustChangePassword: boolean;
}

/** Returned by GET /api/auth/me — the authoritative identity + effective claims. */
export interface CurrentUserResponse {
  userId: number;
  email: string | null;
  fullName: string;
  mustChangePassword: boolean;
  roles: string[];
  claims: ClaimDto[];
  isSystemAdmin: boolean;
}
