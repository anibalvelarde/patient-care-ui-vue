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
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
    },
    {
      path: '/design-options',
      name: 'design-options',
      component: () => import('../views/CompareView.vue'),
    },
    {
      path: '/current',
      name: 'current',
      component: () => import('../views/CurrentView.vue'),
    },
    {
      path: '/option-01',
      name: 'option-01',
      component: () => import('../views/Option01View.vue'),
    },
    {
      path: '/option-03',
      name: 'option-03',
      component: () => import('../views/Option03View.vue'),
    },
    {
      path: '/option-04',
      name: 'option-04',
      component: () => import('../views/Option04View.vue'),
    },
    {
      path: '/option-05',
      name: 'option-05',
      component: () => import('../views/Option05View.vue'),
    },
    {
      path: '/option-06',
      name: 'option-06',
      component: () => import('../views/Option06View.vue'),
    },
    {
      path: '/option-07',
      name: 'option-07',
      component: () => import('../views/Option07View.vue'),
    },
  ],
});

export default router;
