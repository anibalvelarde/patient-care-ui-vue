<template>
  <div class="min-h-screen flex items-center justify-center bg-violet-50 px-4">
    <div class="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <!-- Brand -->
      <div class="flex flex-col items-center mb-6">
        <div class="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center mb-3">
          <span class="text-base font-bold text-white">NC</span>
        </div>
        <h1 class="text-lg font-semibold text-gray-800">NeuroCorp Patient Care</h1>
        <p class="text-xs text-gray-400">Sign in to continue</p>
      </div>

      <!-- Authenticated but no app access: the guard signs such a principal out and redirects here. -->
      <p
        v-if="deniedMessage"
        class="mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
      >
        {{ deniedMessage }}
      </p>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1" for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="username"
            required
            class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1" for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        <p v-if="error" class="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {{ error }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-violet-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

export default defineComponent({
  name: 'LoginView',
  setup() {
    const auth = useAuthStore();
    const router = useRouter();
    const route = useRoute();

    const email = ref('');
    const password = ref('');
    const error = ref('');
    const loading = ref(false);

    // The guard redirects a successfully-authenticated-but-claimless principal here with this flag.
    const deniedMessage = computed(() =>
      route.query.denied === 'no-access'
        ? 'This account doesn’t have access to the application. Please contact an administrator.'
        : '',
    );

    const onSubmit = async () => {
      error.value = '';
      loading.value = true;
      try {
        const { mustChangePassword } = await auth.login(email.value.trim(), password.value);
        if (mustChangePassword) {
          router.push({ name: 'change-password' });
          return;
        }
        const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
        router.push(redirect);
      } catch (e) {
        error.value = e instanceof Error ? e.message : 'Sign in failed. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    return { email, password, error, loading, onSubmit, deniedMessage };
  },
});
</script>
