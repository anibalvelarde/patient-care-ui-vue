<template>
  <div class="min-h-screen flex items-center justify-center bg-violet-50 px-4">
    <div class="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div class="flex flex-col items-center mb-6">
        <div class="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center mb-3">
          <font-awesome-icon :icon="['fas', 'key']" class="text-white" />
        </div>
        <h1 class="text-lg font-semibold text-gray-800">Change your password</h1>
        <p v-if="mustChange" class="text-xs text-amber-600 text-center mt-1">
          You must set a new password before continuing.
        </p>
        <p v-else class="text-xs text-gray-400">Update your account password</p>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1" for="current">Current password</label>
          <input
            id="current"
            v-model="currentPassword"
            type="password"
            autocomplete="current-password"
            required
            class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1" for="new">New password</label>
          <input
            id="new"
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            required
            class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <p class="text-[11px] text-gray-400 mt-1">At least 8 characters, and different from the current one.</p>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1" for="confirm">Confirm new password</label>
          <input
            id="confirm"
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
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
          {{ loading ? 'Updating…' : 'Update password' }}
        </button>

        <button
          type="button"
          @click="onLogout"
          class="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Sign out
        </button>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import { useAuthStore } from '../stores/auth';

library.add(faKey);

export default defineComponent({
  name: 'ChangePasswordView',
  components: { FontAwesomeIcon },
  setup() {
    const auth = useAuthStore();
    const router = useRouter();

    const currentPassword = ref('');
    const newPassword = ref('');
    const confirmPassword = ref('');
    const error = ref('');
    const loading = ref(false);

    const mustChange = computed(() => auth.mustChangePassword);

    const onSubmit = async () => {
      error.value = '';
      if (newPassword.value.length < 8) {
        error.value = 'The new password must be at least 8 characters long.';
        return;
      }
      if (newPassword.value !== confirmPassword.value) {
        error.value = 'The new passwords do not match.';
        return;
      }
      loading.value = true;
      try {
        await auth.changePassword(currentPassword.value, newPassword.value);
        router.push('/');
      } catch (e) {
        error.value = e instanceof Error ? e.message : 'Could not change the password.';
      } finally {
        loading.value = false;
      }
    };

    const onLogout = () => {
      auth.logout();
      router.push({ name: 'login' });
    };

    return { currentPassword, newPassword, confirmPassword, error, loading, mustChange, onSubmit, onLogout };
  },
});
</script>
