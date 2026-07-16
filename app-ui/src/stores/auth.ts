// stores/auth.ts
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { AuthHttpClient } from '../services/AuthHttpClient';
import type { CurrentUserResponse } from '../interfaces/Auth';

const REFRESH_TOKEN_KEY = 'pc_refresh_token';

/**
 * Authentication + claims state.
 *
 * Storage strategy: the access token lives only in memory (never persisted); the refresh token
 * lives in localStorage so a page reload can silently re-mint an access token via initialize().
 * Authoritative identity/roles/claims come from GET /api/auth/me, not from trusting the raw JWT.
 */
export const useAuthStore = defineStore('auth', () => {
  const client = new AuthHttpClient();

  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(localStorage.getItem(REFRESH_TOKEN_KEY));
  const user = ref<CurrentUserResponse | null>(null);
  const initialized = ref(false);

  // Dedupe concurrent refreshes (e.g. several requests 401 at once).
  let refreshInFlight: Promise<boolean> | null = null;

  const isAuthenticated = computed(() => accessToken.value !== null && user.value !== null);
  const isSystemAdmin = computed(() => user.value?.isSystemAdmin ?? false);
  const mustChangePassword = computed(() => user.value?.mustChangePassword ?? false);
  const fullName = computed(() => user.value?.fullName ?? '');
  const roles = computed(() => user.value?.roles ?? []);
  // WP-32 (U4): idle auto-logoff minutes from /auth/me; 0 = disabled, 60 default when absent.
  const idleLogoffMinutes = computed(() => user.value?.idleLogoffMinutes ?? 60);

  /** True if the user holds (type, value), or is a SystemAdmin (the FullAccess wildcard). */
  function hasClaim(type: string, value: string): boolean {
    if (isSystemAdmin.value) return true;
    return (user.value?.claims ?? []).some((c) => c.type === type && c.value === value);
  }
  function hasAnyClaim(claims: Array<[string, string]>): boolean {
    if (isSystemAdmin.value) return true;
    return claims.some(([t, v]) => hasClaim(t, v));
  }
  function hasAllClaims(claims: Array<[string, string]>): boolean {
    if (isSystemAdmin.value) return true;
    return claims.every(([t, v]) => hasClaim(t, v));
  }

  function setTokens(access: string, refresh: string): void {
    accessToken.value = access;
    refreshToken.value = refresh;
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }

  function clearSession(): void {
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  async function loadMe(): Promise<void> {
    user.value = await client.me();
  }

  /** Returns the must-change-password flag so callers can route appropriately. */
  async function login(email: string, password: string): Promise<{ mustChangePassword: boolean }> {
    const result = await client.login({ email, password });
    setTokens(result.accessToken, result.refreshToken);
    await loadMe();
    return { mustChangePassword: result.mustChangePassword };
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const result = await client.changePassword({ currentPassword, newPassword });
    setTokens(result.accessToken, result.refreshToken);
    await loadMe();
  }

  /** Attempt a single silent refresh; resolves true if a new access token was obtained. */
  function refresh(): Promise<boolean> {
    if (refreshInFlight) return refreshInFlight;
    if (!refreshToken.value) return Promise.resolve(false);

    refreshInFlight = (async () => {
      try {
        const result = await client.refresh(refreshToken.value as string);
        setTokens(result.accessToken, result.refreshToken);
        if (!user.value) await loadMe();
        return true;
      } catch {
        clearSession();
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
    return refreshInFlight;
  }

  function logout(): void {
    clearSession();
  }

  /** Restore a session on app start from the stored refresh token. Safe to await once. */
  async function initialize(): Promise<void> {
    if (initialized.value) return;
    if (refreshToken.value) {
      await refresh();
    }
    initialized.value = true;
  }

  return {
    accessToken,
    user,
    initialized,
    isAuthenticated,
    isSystemAdmin,
    mustChangePassword,
    fullName,
    roles,
    idleLogoffMinutes,
    hasClaim,
    hasAnyClaim,
    hasAllClaims,
    login,
    changePassword,
    refresh,
    logout,
    initialize,
  };
});
