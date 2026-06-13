// WP-17C — accessGuard behavior.
//
// Regression focus: a successfully-authenticated principal with NO usable app access (e.g. a
// Caretaker-only / claimless user) must NOT loop on the dashboard fallback and leave the UI blank.
// The guard signs them out and routes to login?denied=no-access so the screen can explain.

import { describe, it, expect } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import type { RouteLocationNormalized } from 'vue-router';
import { accessGuard } from '../router';
import { useAuthStore } from '../stores/auth';
import manifest from '../generated/access-control-matrix.json';
import { Permissions } from '../generated/permissions';
import type { ClaimDto } from '../interfaces/Auth';

type Role = 'MGR' | 'AM' | 'FD';

function claimsForRole(role: Role): ClaimDto[] {
  return (manifest.claims as Array<{ claim: string; grants: string[] }>)
    .filter((c) => c.grants.includes(role))
    .map((c) => ({ type: 'Permission', value: c.claim }));
}

function authAs(opts: { role?: Role; isSystemAdmin?: boolean; authenticated?: boolean }) {
  setActivePinia(createPinia());
  const store = useAuthStore();
  store.initialized = true; // skip initialize()'s network refresh
  if (opts.authenticated ?? true) {
    store.accessToken = 'test-token';
    store.user = {
      userId: 1,
      email: 'test@example.com',
      fullName: 'Test User',
      mustChangePassword: false,
      roles: opts.role ? [opts.role] : ['Caretaker'],
      claims: opts.role ? claimsForRole(opts.role) : [],
      isSystemAdmin: opts.isSystemAdmin ?? false,
    };
  }
  return store;
}

const to = (over: Partial<RouteLocationNormalized> = {}) =>
  ({ name: 'dashboard', fullPath: '/', meta: {}, ...over }) as unknown as RouteLocationNormalized;

describe('accessGuard', () => {
  it('signs out a claimless authenticated user and routes to login?denied (no dashboard loop)', async () => {
    const store = authAs({}); // authenticated, no role claims → no Dashboard.View
    const result = await accessGuard(
      to({ name: 'dashboard', fullPath: '/', meta: { permission: Permissions.DashboardView } }),
    );
    expect(result).toMatchObject({ name: 'login', query: { denied: 'no-access' } });
    expect(store.isAuthenticated).toBe(false); // logged out
  });

  it('lets a FrontDesk user reach the dashboard', async () => {
    authAs({ role: 'FD' });
    const result = await accessGuard(
      to({ name: 'dashboard', fullPath: '/', meta: { permission: Permissions.DashboardView } }),
    );
    expect(result).toBe(true);
  });

  it('redirects FrontDesk away from a page it lacks (Statements) to the dashboard', async () => {
    authAs({ role: 'FD' });
    const result = await accessGuard(
      to({ name: 'statements', fullPath: '/statements', meta: { permission: Permissions.StatementsView } }),
    );
    expect(result).toMatchObject({ name: 'dashboard' });
  });

  it('redirects a non-SA user away from /admin', async () => {
    authAs({ role: 'MGR' });
    const result = await accessGuard(
      to({ name: 'admin', fullPath: '/admin', meta: { requiresSystemAdmin: true } }),
    );
    expect(result).toMatchObject({ name: 'dashboard' });
  });

  it('sends an unauthenticated user to login with a redirect back', async () => {
    authAs({ authenticated: false });
    const result = await accessGuard(
      to({ name: 'patients', fullPath: '/patients', meta: { permission: Permissions.PatientsView } }),
    );
    expect(result).toMatchObject({ name: 'login', query: { redirect: '/patients' } });
  });

  it('lets a SystemAdmin reach /admin', async () => {
    authAs({ isSystemAdmin: true });
    const result = await accessGuard(
      to({ name: 'admin', fullPath: '/admin', meta: { requiresSystemAdmin: true } }),
    );
    expect(result).toBe(true);
  });
});
