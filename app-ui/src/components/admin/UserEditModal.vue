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
            <h2 class="text-lg font-semibold text-slate-800">Edit Operator</h2>
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
        <form class="flex-1 overflow-y-auto px-6 py-4 space-y-4" data-testid="user-edit-form" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Operator Roles</label>
            <p v-if="rolesError" class="text-sm text-red-600" data-testid="user-edit-roles-error">{{ rolesError }}</p>
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
                  data-testid="user-edit-role-option"
                  class="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                {{ role.name }}
              </label>
            </div>
            <p class="mt-1 text-xs text-slate-500">
              Saving replaces the operator-role set. An operator account must keep at least one
              operator role — deactivate instead of removing all roles.
            </p>
          </div>

          <div v-if="user.identityRoles.length > 0" class="text-xs text-slate-400 italic" data-testid="user-edit-identity-hint">
            Also a {{ user.identityRoles.join(', ') }} — identity roles are managed by their own workflows and are not affected here.
          </div>

          <div class="pt-2 border-t border-slate-100">
            <label class="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                v-model="isActive"
                type="checkbox"
                data-testid="user-edit-active-toggle"
                class="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Active (can sign in)
            </label>
            <p class="mt-1 text-xs text-slate-500">Deactivating blocks sign-in without deleting the account.</p>
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
              data-testid="user-edit-submit"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              @click="handleSubmit"
            >
              {{ saving ? 'Saving...' : 'Save Changes' }}
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
import type { AdminUserSummary, AdminUserUpdateRequest, OperatorRole } from '../../interfaces/AdminUsers';

export default defineComponent({
  name: 'UserEditModal',
  components: { FormErrorBanner },
  props: {
    visible: { type: Boolean, required: true },
    user: { type: Object as PropType<AdminUserSummary | null>, default: null },
    /** Operator roles only — the parent filters out identity roles (G1/G4). */
    roleOptions: { type: Array as PropType<OperatorRole[]>, required: true },
    rolesError: { type: String, default: '' },
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const { error, hasError, saving, clearError, submit } = useModalForm();
    const client = new AdminUsersHttpClient();

    const selectedRoleIds = ref<number[]>([]);
    const isActive = ref(true);

    watch(selectedRoleIds, () => clearError());
    watch(isActive, () => clearError());

    watch(
      () => props.visible,
      (val) => {
        if (!val || !props.user) return;
        clearError();
        selectedRoleIds.value = props.user.operatorRoles.map((r) => r.roleTypeId);
        isActive.value = props.user.isActive;
      },
    );

    /** PUT semantics: omitted field = unchanged — only include what the admin actually changed. */
    const buildPayload = (): AdminUserUpdateRequest => {
      if (!props.user) return {};
      const payload: AdminUserUpdateRequest = {};
      const original = props.user.operatorRoles.map((r) => r.roleTypeId).sort((a, b) => a - b);
      const selected = [...selectedRoleIds.value].sort((a, b) => a - b);
      const rolesChanged = original.length !== selected.length || original.some((id, i) => id !== selected[i]);
      if (rolesChanged) payload.operatorRoleTypeIds = [...selectedRoleIds.value];
      if (isActive.value !== props.user.isActive) payload.isActive = isActive.value;
      return payload;
    };

    const handleSubmit = () => {
      if (!props.user) return;
      const payload = buildPayload();
      if (Object.keys(payload).length === 0) {
        emit('close'); // nothing changed — no call to make
        return;
      }
      // Guard-rail 400s (self-deactivate / self-demote / last-SYSADMIN / empty role set)
      // arrive as ProblemDetails detail strings and surface verbatim in the banner.
      return submit(async () => {
        await client.updateUser(props.user!.userId, payload);
        emit('saved');
      });
    };

    return { selectedRoleIds, isActive, saving, error, hasError, handleSubmit };
  },
});
</script>
