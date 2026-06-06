import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

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
    },
    {
      path: '/patients',
      name: 'patients',
      component: () => import('../views/PatientsView.vue'),
    },
    {
      path: '/therapists',
      name: 'therapists',
      component: () => import('../views/TherapistsView.vue'),
    },
    {
      path: '/caretakers',
      name: 'caretakers',
      component: () => import('../views/CaretakersView.vue'),
    },
    {
      path: '/payments',
      name: 'payments',
      component: () => import('../views/PaymentsView.vue'),
    },
    {
      path: '/statements',
      name: 'statements',
      component: () => import('../views/StatementView.vue'),
    },
    {
      path: '/appointments',
      name: 'appointments',
      component: () => import('../views/AppointmentsView.vue'),
    },
    {
      path: '/treatment-plans',
      name: 'treatment-plans',
      component: () => import('../views/TreatmentPlansView.vue'),
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: () => import('../views/ScheduleMatrixView.vue'),
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresSystemAdmin: true },
    },
  ],
});

// Global guard: enforce authentication, the must-change-password gate, and SA-only routes.
router.beforeEach(async (to) => {
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

  // Don't show the login page to an already-authenticated user.
  if (auth.isAuthenticated && to.name === 'login') {
    return { name: 'dashboard' };
  }

  if (to.meta.requiresSystemAdmin && !auth.isSystemAdmin) {
    return { name: 'dashboard' };
  }

  return true;
});

export default router;
