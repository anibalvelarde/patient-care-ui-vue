// services/AuthHttpClient.ts
import { HttpClientBase } from './HttpClientBase';
import type {
  AuthTokenResponse,
  ChangePasswordRequest,
  CurrentUserResponse,
  LoginRequest,
} from '../interfaces/Auth';

export class AuthHttpClient extends HttpClientBase {
  /** Anonymous — a 401 here means bad credentials, not an expired session. */
  async login(request: LoginRequest): Promise<AuthTokenResponse> {
    return this.postAnonymous<AuthTokenResponse>('/api/auth/login', request);
  }

  /** Anonymous — the refresh token is the credential. */
  async refresh(refreshToken: string): Promise<AuthTokenResponse> {
    return this.postAnonymous<AuthTokenResponse>('/api/auth/refresh', { refreshToken });
  }

  /** Authenticated — authoritative identity, roles, and effective claims. */
  async me(): Promise<CurrentUserResponse> {
    return this.get<CurrentUserResponse>('/api/auth/me');
  }

  /** Authenticated — rotates tokens and clears the must-change flag. */
  async changePassword(request: ChangePasswordRequest): Promise<AuthTokenResponse> {
    return this.post<AuthTokenResponse>('/api/auth/change-password', request);
  }
}
