<template>
  <teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex justify-end">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>

      <!-- Slide-over panel -->
      <div class="relative w-full max-w-md bg-white shadow-xl flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-800">Add Operator</h2>
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
        <form class="flex-1 overflow-y-auto px-6 py-4 space-y-4" data-testid="user-create-form" @submit.prevent="handleSubmit">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
              <input
                v-model="form.firstName"
                type="text"
                required
                data-testid="user-create-first-name"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
              <input
                v-model="form.lastName"
                type="text"
                required
                data-testid="user-create-last-name"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input
              v-model="form.email"
              type="email"
              required
              data-testid="user-create-email"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p class="mt-1 text-xs text-slate-500">This is the sign-in email (login).</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Temporary Password *</label>
            <input
              v-model="form.tempPassword"
              type="password"
              required
              autocomplete="new-password"
              data-testid="user-create-temp-password"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p class="mt-1 text-xs text-slate-500">
              Minimum 8 characters. The account is created active and the user
              <span class="font-medium">must change this password at next login</span>.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Operator Roles *</label>
            <p v-if="rolesError" class="text-sm text-red-600" data-testid="user-create-roles-error">{{ rolesError }}</p>
            <p v-else-if="roleOptions.length === 0" class="text-sm text-slate-400">Loading roles…</p>
            <div v-else class="space-y-1.5">
              <label
                v-for="role in roleOptions"
                :key="role.roleTypeId"
                class="flex items-center gap-2 text-sm text-slate-700"
              >
                <input
                  v-model="selectedRoleIds"
                  type="checkbox"
                  :value="role.roleTypeId"
                  data-testid="user-create-role-option"
                  class="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                {{ role.name }}
              </label>
            </div>
            <p class="mt-1 text-xs text-slate-500">
              Patient, Therapist, and Caretaker identities are managed by their own workflows, not here.
            </p>
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
              data-testid="user-create-submit"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              @click="handleSubmit"
            >
              {{ saving ? 'Creating...' : 'Create Account' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, watch, type PropType } from 'vue';
import { AdminUsersHttpClient } from '../../services/AdminUsersHttpClient';
import { useModalForm } from '../../composables/useModalForm';
import FormErrorBanner from '../shared/FormErrorBanner.vue';
import type { OperatorRole } from '../../interfaces/AdminUsers';

export default defineComponent({
  name: 'UserCreateModal',
  components: { FormErrorBanner },
  props: {
    visible: { type: Boolean, required: true },
    /** Operator roles only — the parent filters out identity roles (G1/G4). */
    roleOptions: { type: Array as PropType<OperatorRole[]>, required: true },
    rolesError: { type: String, default: '' },
  },
  emits: ['close', 'created'],
  setup(props, { emit }) {
    const { error, hasError, saving, setError, clearError, submit } = useModalForm();
    const client = new AdminUsersHttpClient();

    const form = reactive({ firstName: '', lastName: '', email: '', tempPassword: '' });
    const selectedRoleIds = ref<number[]>([]);

    watch(form, () => clearError(), { deep: true });
    watch(selectedRoleIds, () => clearError());

    watch(
      () => props.visible,
      (val) => {
        if (!val) return;
        clearError();
        form.firstName = '';
        form.lastName = '';
        form.email = '';
        form.tempPassword = '';
        selectedRoleIds.value = [];
      },
    );

    const handleSubmit = () => {
      if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.tempPassword) {
        setError('Please fill in all required fields.');
        return;
      }
      // Mirrors the API's shared PasswordPolicy.MinLength (same rule ChangePassword enforces).
      if (form.tempPassword.length < 8) {
        setError('The temporary password must be at least 8 characters long.');
        return;
      }
      if (selectedRoleIds.value.length === 0) {
        setError('Select at least one operator role.');
        return;
      }
      // Dup email 409 / guard-rail 400 detail strings surface verbatim via useModalForm.
      return submit(async () => {
        const created = await client.createUser({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          tempPassword: form.tempPassword,
          operatorRoleTypeIds: [...selectedRoleIds.value],
        });
        emit('created', created);
      });
    };

    return { form, selectedRoleIds, saving, error, hasError, handleSubmit };
  },
});
</script>
