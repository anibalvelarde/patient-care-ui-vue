import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { Permissions, type Permission } from '../generated/permissions';

declare module 'vue-router' {
  interface RouteMeta {
    /** Route is reachable without authentication (login only). */
    public?: boolean;
    /** Route requires the SystemAdmin wildcard. */
    requiresSystemAdmin?: boolean;
    /** Coarse page-access claim required to enter the route (WP-17C). */
    permission?: Permission;
  }
}

// `meta.permission` (a generated coarse `*.View` claim) gates page access: the global guard below
// redirects to the user's landing route (first allowed page) when they lack it (WP-17C; landing
// order added for Questionnaire A roles — ACCT has no Dashboard.View). SYSADMIN passes everything
// via the wildcard. `/admin` stays SYSADMIN-only this WP — honoring the matrix's MGR `Admin.View`
// (read-only) is a tracked 17C follow-up (needs AdminView's Manage controls split first).
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/change-password',
      name: 'change-password',
      component: () => import('../views/ChangePasswordView.vue'),
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/Option02View.vue'),
      meta: { permission: Permissions.DashboardView },
    },
    {
      path: '/patients',
      name: 'patients',
      component: () => import('../views/PatientsView.vue'),
      meta: { permission: Permissions.PatientsView },
    },
    {
      path: '/therapists',
      name: 'therapists',
      component: () => import('../views/TherapistsView.vue'),
      meta: { permission: Permissions.TherapistsView },
    },
    {
      path: '/caretakers',
      name: 'caretakers',
      component: () => import('../views/CaretakersView.vue'),
      meta: { permission: Permissions.CaretakersView },
    },
    {
      path: '/payments',
      name: 'payments',
      component: () => import('../views/PaymentsView.vue'),
      meta: { permission: Permissions.PaymentsView },
    },
    {
      path: '/statements',
      name: 'statements',
      component: () => import('../views/StatementView.vue'),
      meta: { permission: Permissions.StatementsView },
    },
    {
      path: '/service-payments',
      name: 'service-payments',
      component: () => import('../views/ServicePaymentsView.vue'),
      meta: { permission: Permissions.ServicePaymentsView },
    },
    {
      path: '/appointments',
      name: 'appointments',
      component: () => import('../views/AppointmentsView.vue'),
      meta: { permission: Permissions.AppointmentsView },
    },
    {
      path: '/treatment-plans',
      name: 'treatment-plans',
      component: () => import('../views/TreatmentPlansView.vue'),
      meta: { permission: Permissions.TreatmentPlansView },
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: () => import('../views/ScheduleMatrixView.vue'),
      meta: { permission: Permissions.ScheduleView },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresSystemAdmin: true },
    },
  ],
});

// Landing candidates in preference order. Not every operator role holds Dashboard.View
// (Questionnaire A: ACCT doesn't), so redirects resolve to the user's FIRST allowed page
// instead of a hard-coded dashboard — which would sign such users out / loop them.
// `/admin` is excluded: it's SA-only in the UI for now (17C follow-up).
const LANDING_ORDER: ReadonlyArray<readonly [Permission, string]> = [
  [Permissions.DashboardView, 'dashboard'],
  [Permissions.PatientsView, 'patients'],
  [Permissions.TherapistsView, 'therapists'],
  [Permissions.CaretakersView, 'caretakers'],
  [Permissions.PaymentsView, 'payments'],
  [Permissions.StatementsView, 'statements'],
  [Permissions.ServicePaymentsView, 'service-payments'],
  [Permissions.AppointmentsView, 'appointments'],
  [Permissions.TreatmentPlansView, 'treatment-plans'],
  [Permissions.ScheduleView, 'schedule'],
];

/** The signed-in user's landing route: first page they may open, or null if none. */
function landingRoute(auth: ReturnType<typeof useAuthStore>): string | null {
  if (auth.isSystemAdmin) return 'dashboard';
  const hit = LANDING_ORDER.find(([claim]) => auth.hasClaim('Permission', claim));
  return hit ? hit[1] : null;
}

/** Does the signed-in user have a usable entry into the operator app? */
function hasAppAccess(auth: ReturnType<typeof useAuthStore>): boolean {
  // A principal with no reachable page at all — e.g. a Caretaker-only / claimless user.
  return landingRoute(auth) !== null;
}

/**
 * Global navigation guard: authentication, the must-change-password gate, SA-only routes, and the
 * WP-17C coarse page-access gate. Exported for unit testing (see __tests__/router-guard.spec.ts).
 */
export async function accessGuard(to: RouteLocationNormalized) {
  const auth = useAuthStore();

  // Restore a session from the stored refresh token before the first protected navigation.
  if (!auth.initialized) {
    await auth.initialize();
  }

  const isPublic = to.meta.public === true;

  if (!isPublic && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  // A signed-in user who still owes a password change can only reach the change-password screen.
  if (auth.isAuthenticated && auth.mustChangePassword && to.name !== 'change-password') {
    return { name: 'change-password' };
  }

  // Authenticated but with no usable app access (e.g. a Caretaker-only / claimless principal). Without
  // this, such a user bounces off every page's permission gate and loops on the dashboard fallback, so
  // the navigation aborts and the UI shows nothing. Sign them out and send them to login with a flag
  // the screen explains. (WP-17C — login still authenticates; it's the authorization that's empty.)
  if (auth.isAuthenticated && !auth.mustChangePassword && !hasAppAccess(auth)) {
    auth.logout();
    return to.name === 'login' ? true : { name: 'login', query: { denied: 'no-access' } };
  }

  // Don't show the login page to an already-authenticated user.
  if (auth.isAuthenticated && to.name === 'login') {
    return { name: landingRoute(auth)! };
  }

  if (to.meta.requiresSystemAdmin && !auth.isSystemAdmin) {
    return { name: landingRoute(auth)! };
  }

  // Coarse page-access gate: a route with a `meta.permission` requires that claim (WP-17C).
  // SYSADMIN passes via the wildcard inside hasClaim. Unauthorized users land on their landing
  // route — their first allowed page, which passes this gate by construction (no redirect loop).
  // landingRoute() is non-null here: hasAppAccess() above already signed out users without one.
  const permission = to.meta.permission;
  if (typeof permission === 'string' && !auth.hasClaim('Permission', permission)) {
    return { name: landingRoute(auth)! };
  }

  return true;
}

router.beforeEach(accessGuard);

export default router;
