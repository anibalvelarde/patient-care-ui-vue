import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
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
    },
  ],
});

export default router;
