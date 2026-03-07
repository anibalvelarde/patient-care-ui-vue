import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'compare',
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
      path: '/option-02',
      name: 'option-02',
      component: () => import('../views/Option02View.vue'),
    },
    {
      path: '/option-03',
      name: 'option-03',
      component: () => import('../views/Option03View.vue'),
    },
  ],
});

export default router;
