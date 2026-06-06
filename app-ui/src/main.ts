import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';
import { authBridge } from './services/authBridge';
import './assets/styles.css';
import './tailwind.css';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

// Wire the low-level HTTP client (via authBridge) to the auth store + router. Done here, where
// both are available, to keep HttpClientBase free of store/router imports (avoids an import cycle).
const auth = useAuthStore(pinia);
authBridge.setAccessTokenGetter(() => auth.accessToken);
authBridge.setRefreshFn(() => auth.refresh());
authBridge.setOnUnauthorized(() => {
  auth.logout();
  if (router.currentRoute.value.name !== 'login') {
    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
  }
});
authBridge.setOnForbidden((code) => {
  if (code === 'password_change_required' && router.currentRoute.value.name !== 'change-password') {
    router.push({ name: 'change-password' });
  }
});

// Restore any existing session before mounting so the first navigation guard sees correct state.
auth.initialize().finally(() => {
  app.mount('#app');
});
