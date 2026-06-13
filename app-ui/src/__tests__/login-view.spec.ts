// WP-17C — LoginView shows the "no access" notice when the guard redirects a claimless principal here.

import { describe, it, expect } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory, type Router } from 'vue-router';
import LoginView from '../views/LoginView.vue';

async function mountAt(path: string) {
  setActivePinia(createPinia());
  const router: Router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: LoginView },
      { path: '/', name: 'dashboard', component: { template: '<div/>' } },
    ],
  });
  router.push(path);
  await router.isReady();
  return mount(LoginView, { global: { plugins: [router] } });
}

describe('LoginView access-denied notice', () => {
  it('shows the no-access notice when ?denied=no-access is present', async () => {
    const w = await mountAt('/login?denied=no-access');
    expect(w.text()).toContain('access to the application');
  });

  it('shows no such notice on a normal login visit', async () => {
    const w = await mountAt('/login');
    expect(w.text()).not.toContain('access to the application');
  });
});
