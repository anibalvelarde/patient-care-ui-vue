<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200">
    <div class="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-slate-800">Users</h2>
        <p class="text-sm text-slate-500 mt-0.5">
          Operator accounts — sign-in, roles, and status.
          <span v-if="!canManage" data-testid="users-readonly-note" class="text-slate-400">
            Read-only: changes require a System Administrator.
          </span>
        </p>
      </div>
      <button
        v-if="canManage"
        class="shrink-0 flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        data-testid="users-add-button"
        @click="createVisible = true"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Operator</span>
      </button>
    </div>

    <div class="p-6 space-y-4">
      <!-- Success banner -->
      <div
        v-if="successMessage"
        data-testid="users-success-banner"
        class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
      >
        {{ successMessage }}
      </div>

      <!-- Search -->
      <div class="relative w-full sm:w-80">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Search by name or email..."
          data-testid="users-search-input"
          class="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p class="mt-2 text-sm text-slate-500">Loading users...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" data-testid="users-error" class="bg-red-50 rounded-xl p-6 text-center">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button class="mt-2 text-sm font-medium text-red-600 hover:text-red-800" @click="loadUsers">
          Try again
        </button>
      </div>

      <template v-else>
        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm" data-testid="users-table">
            <thead>
              <tr class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th class="py-2 pr-4">Name</th>
                <th class="py-2 pr-4">Email (login)</th>
                <th class="py-2 pr-4">Roles</th>
                <th class="py-2 pr-4">Active</th>
                <th class="py-2 pr-4">Password</th>
                <th v-if="canManage" class="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="users.length === 0">
                <td :colspan="canManage ? 6 : 5" class="py-8 text-center text-slate-400" data-testid="users-empty">
                  No operator accounts found.
                </td>
              </tr>
              <tr
                v-for="user in users"
                :key="user.userId"
                class="border-b border-slate-100 hover:bg-slate-50"
                data-testid="users-row"
              >
                <td class="py-2.5 pr-4 font-medium text-slate-800">{{ user.firstName }} {{ user.lastName }}</td>
                <td class="py-2.5 pr-4 text-slate-600">{{ user.email }}</td>
                <td class="py-2.5 pr-4">
                  <div class="flex flex-wrap items-center gap-1">
                    <span
                      v-for="role in user.operatorRoles"
                      :key="role.roleTypeId"
                      class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700"
                      data-testid="users-role-chip"
                    >
                      {{ role.name }}
                    </span>
                    <span
                      v-if="user.identityRoles.length > 0"
                      class="text-xs text-slate-400 italic"
                      data-testid="users-identity-hint"
                    >
                      also: {{ user.identityRoles.join(', ') }}
                    </span>
                  </div>
                </td>
                <td class="py-2.5 pr-4">
                  <span
                    :class="user.isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'"
                    class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                    data-testid="users-active-badge"
                  >
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="py-2.5 pr-4">
                  <span
                    v-if="user.mustChangePassword"
                    class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700"
                    title="A temporary password is set — the user must change it at next login."
                    data-testid="users-must-change"
                  >
                    Must change
                  </span>
                  <span v-else class="text-xs text-slate-400">—</span>
                </td>
                <td v-if="canManage" class="py-2.5 text-right whitespace-nowrap">
                  <button
                    class="px-2.5 py-1 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50"
                    data-testid="users-edit-button"
                    @click="openEdit(user)"
                  >
                    Edit
                  </button>
                  <button
                    class="px-2.5 py-1 rounded-lg text-xs font-medium text-amber-600 hover:bg-amber-50"
                    data-testid="users-reset-button"
                    @click="openReset(user)"
                  >
                    Reset password
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paging footer (WP-30 pattern) -->
        <div class="flex items-center justify-between text-sm text-slate-500">
          <button
            class="px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed text-blue-600 hover:bg-blue-50"
            :disabled="page <= 1 || loading"
            data-testid="users-prev"
            @click="goToPage(page - 1)"
          >
            ◀ Prev
          </button>
          <span data-testid="users-page-label">
            Page {{ page }} of {{ totalPages }} · {{ totalCount }} user{{ totalCount !== 1 ? 's' : '' }}
          </span>
          <button
            class="px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed text-blue-600 hover:bg-blue-50"
            :disabled="page >= totalPages || loading"
            data-testid="users-next"
            @click="goToPage(page + 1)"
          >
            Next ▶
          </button>
        </div>
      </template>
    </div>

    <!-- Modals (Manage-gated: only ever opened via Manage-gated controls) -->
    <UserCreateModal
      :visible="createVisible"
      :role-options="roleOptions"
      :roles-error="rolesError"
      @close="createVisible = false"
      @created="onCreated"
    />
    <UserEditModal
      :visible="editVisible"
      :user="selectedUser"
      :role-options="roleOptions"
      :roles-error="rolesError"
      @close="editVisible = false"
      @saved="onEdited"
    />
    <UserResetPasswordModal
      :visible="resetVisible"
      :user="selectedUser"
      @close="resetVisible = false"
      @saved="onPasswordReset"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted, ref, watch } from 'vue';
import { AdminUsersHttpClient } from '../../services/AdminUsersHttpClient';
import { LookupHttpClient } from '../../services/LookupHttpClient';
import { useClaims, Permissions } from '../../composables/useClaims';
import { useFormError } from '../../composables/useFormError';
import UserCreateModal from './UserCreateModal.vue';
import UserEditModal from './UserEditModal.vue';
import UserResetPasswordModal from './UserResetPasswordModal.vue';
import type { AdminUserSummary, OperatorRole } from '../../interfaces/AdminUsers';

export const SEARCH_DEBOUNCE_MS = 300;
export const PAGE_SIZE = 25;

// G1/G4: identity roles are workflow-managed and never assignable here — filter them out of
// the role picker no matter what the lookup returns (matches the API's RoleTaxonomy partition).
const IDENTITY_ROLE_NAMES = ['patient', 'therapist', 'caretaker'];

export default defineComponent({
  name: 'UsersPanel',
  components: { UserCreateModal, UserEditModal, UserResetPasswordModal },
  setup() {
    // WP-41C: section visibility rides Admin.Users.View (MGR/OWN + SYSADMIN wildcard);
    // every write control rides Admin.Users.Manage (SYSADMIN-only) — MGR/OWN get a
    // read-only table with no buttons.
    const { hasClaim } = useClaims();
    const canView = hasClaim('Permission', Permissions.AdminUsersView);
    const canManage = hasClaim('Permission', Permissions.AdminUsersManage);

    const client = new AdminUsersHttpClient();
    const lookupClient = new LookupHttpClient();

    const users = ref<AdminUserSummary[]>([]);
    const totalCount = ref(0);
    const page = ref(1);
    const search = ref('');
    const loading = ref(false);
    const { message: error, setFromException, clear: clearError } = useFormError();
    const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE)));

    const loadUsers = async () => {
      if (!canView) return; // avoid a guaranteed 403 (section is hidden without View anyway)
      loading.value = true;
      clearError();
      try {
        const result = await client.getUsers({ search: search.value.trim(), page: page.value, pageSize: PAGE_SIZE });
        users.value = result.items;
        totalCount.value = result.totalCount;
        page.value = result.page;
      } catch (e: unknown) {
        setFromException(e, 'Failed to load users.');
      } finally {
        loading.value = false;
      }
    };

    const goToPage = (target: number) => {
      page.value = target;
      loadUsers();
    };

    // Debounced server-side search; a new term restarts from page 1 (WP-30 pattern).
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    watch(search, () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        page.value = 1;
        loadUsers();
      }, SEARCH_DEBOUNCE_MS);
    });

    // ── Role options (Manage-only: the picker feeds Manage-gated modals) ────
    // Source = the RoleType lookup table (WP-7), filtered client-side to operator roles.
    const roleOptions = ref<OperatorRole[]>([]);
    const rolesError = ref('');
    const loadRoleOptions = async () => {
      try {
        const items = await lookupClient.getAll('role-types');
        roleOptions.value = items
          .filter((item) => !IDENTITY_ROLE_NAMES.includes(item.name.trim().toLowerCase()))
          .map((item) => ({ roleTypeId: item.id, name: item.name }));
      } catch (e: unknown) {
        rolesError.value = e instanceof Error ? e.message : 'Failed to load role options.';
      }
    };

    onMounted(() => {
      loadUsers();
      if (canManage) loadRoleOptions();
    });

    // ── Modal orchestration ─────────────────────────────────────────────────
    const createVisible = ref(false);
    const editVisible = ref(false);
    const resetVisible = ref(false);
    const selectedUser = ref<AdminUserSummary | null>(null);

    const openEdit = (user: AdminUserSummary) => {
      selectedUser.value = user;
      editVisible.value = true;
    };
    const openReset = (user: AdminUserSummary) => {
      selectedUser.value = user;
      resetVisible.value = true;
    };

    const successMessage = ref('');
    let successTimer: ReturnType<typeof setTimeout> | undefined;
    const showSuccess = (message: string) => {
      successMessage.value = message;
      clearTimeout(successTimer);
      successTimer = setTimeout(() => { successMessage.value = ''; }, 6000);
    };

    const onCreated = (created: AdminUserSummary) => {
      createVisible.value = false;
      showSuccess(`Operator account created for ${created.email}. They must change the temporary password at next login.`);
      loadUsers();
    };
    const onEdited = () => {
      editVisible.value = false;
      showSuccess('Changes saved.');
      loadUsers();
    };
    const onPasswordReset = () => {
      resetVisible.value = false;
      showSuccess(`Temporary password set for ${selectedUser.value?.email ?? 'the user'}. They must change it at next login.`);
      loadUsers();
    };

    return {
      canManage,
      users, totalCount, page, totalPages, search, loading, error,
      loadUsers, goToPage,
      roleOptions, rolesError,
      createVisible, editVisible, resetVisible, selectedUser,
      openEdit, openReset,
      successMessage, onCreated, onEdited, onPasswordReset,
    };
  },
});
</script>
