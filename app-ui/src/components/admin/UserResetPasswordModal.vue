<template>
  <teleport to="body">
    <div v-if="visible && user" class="fixed inset-0 z-50 flex justify-end">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>

      <!-- Slide-over panel -->
      <div class="relative w-full max-w-md bg-white shadow-xl flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-slate-800">Reset Password</h2>
            <p class="text-xs text-slate-500 mt-0.5">{{ user.firstName }} {{ user.lastName }} · {{ user.email }}</p>
          </div>
          <button
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            @click="$emit('close')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <form class="flex-1 overflow-y-auto px-6 py-4 space-y-4" data-testid="user-reset-form" @submit.prevent="handleSubmit">
          <p class="text-sm text-slate-600">
            Set a temporary password for this account. The user
            <span class="font-medium">must change it at their next login</span> before doing anything else.
          </p>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Temporary Password *</label>
            <input
              v-model="tempPassword"
              type="password"
              required
              autocomplete="new-password"
              data-testid="user-reset-temp-password"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p class="mt-1 text-xs text-slate-500">Minimum 8 characters.</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Confirm Temporary Password *</label>
            <input
              v-model="confirmPassword"
              type="password"
              required
              autocomplete="new-password"
              data-testid="user-reset-confirm-password"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </form>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-200 space-y-3">
          <FormErrorBanner :message="error" />
          <div class="flex items-center justify-end space-x-3">
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
              @click="$emit('close')"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="saving || hasError"
              data-testid="user-reset-submit"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
              @click="handleSubmit"
            >
              {{ saving ? 'Resetting...' : 'Reset Password' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, ref, watch, type PropType } from 'vue';
import { AdminUsersHttpClient } from '../../services/AdminUsersHttpClient';
import { useModalForm } from '../../composables/useModalForm';
import FormErrorBanner from '../shared/FormErrorBanner.vue';
import type { AdminUserSummary } from '../../interfaces/AdminUsers';

export default defineComponent({
  name: 'UserResetPasswordModal',
  components: { FormErrorBanner },
  props: {
    visible: { type: Boolean, required: true },
    user: { type: Object as PropType<AdminUserSummary | null>, default: null },
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const { error, hasError, saving, setError, clearError, submit } = useModalForm();
    const client = new AdminUsersHttpClient();

    const tempPassword = ref('');
    const confirmPassword = ref('');

    watch([tempPassword, confirmPassword], () => clearError());

    watch(
      () => props.visible,
      (val) => {
        if (!val) return;
        clearError();
        tempPassword.value = '';
        confirmPassword.value = '';
      },
    );

    const handleSubmit = () => {
      if (!props.user) return;
      // Mirrors the API's shared PasswordPolicy.MinLength (same rule ChangePassword enforces).
      if (tempPassword.value.length < 8) {
        setError('The temporary password must be at least 8 characters long.');
        return;
      }
      if (tempPassword.value !== confirmPassword.value) {
        setError('Passwords do not match.');
        return;
      }
      return submit(async () => {
        await client.resetPassword(props.user!.userId, tempPassword.value);
        emit('saved');
      });
    };

    return { tempPassword, confirmPassword, saving, error, hasError, handleSubmit };
  },
});
</script>
