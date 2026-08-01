// WP-41C — Admin Users UI (SA-only v1) + P1 sticky sidebar.
//
// Covers:
//  - Section visibility rides Admin.Users.View (MGR/OWN + SYSADMIN see the nav entry; FD doesn't).
//  - Action gating rides Admin.Users.Manage (SYSADMIN-only): MGR gets a read-only table, no buttons.
//  - Table paging/search wiring (WP-30 pattern: debounced server search, Prev/Next re-query).
//  - Create modal: validation, identity roles filtered OUT of the option list, exact payload shape.
//  - Edit modal: omitted-unchanged PUT semantics (only changed fields in the payload).
//  - Guard-rail 400 ProblemDetails detail strings surface VERBATIM (they're actionable messages).
//  - Reset-password flow: min-8 + confirm validation, API call, success banner.
//  - P1 sticky sidebar: md-scoped sticky/self-scroll classes present, mobile classes untouched.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia, type Pinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import type { AdminUserSummary } from '../interfaces/AdminUsers';
import type { LookupItem } from '../interfaces/Lookups';
import AdminAccordionNav from '../components/admin/AdminAccordionNav.vue';
import UsersPanel from '../components/admin/UsersPanel.vue';
import O2Sidebar from '../components/option02/O2Sidebar.vue';

// ── HttpClient mocks (every client the panel or its modals new up) ──────────
const { getUsersMock, getUserMock, createUserMock, updateUserMock, resetPasswordMock, lookupGetAllMock } = vi.hoisted(() => ({
  getUsersMock: vi.fn(),
  getUserMock: vi.fn(),
  createUserMock: vi.fn(),
  updateUserMock: vi.fn(),
  resetPasswordMock: vi.fn(),
  lookupGetAllMock: vi.fn(),
}));

vi.mock('../services/AdminUsersHttpClient', () => ({
  AdminUsersHttpClient: vi.fn().mockImplementation(() => ({
    getUsers: getUsersMock,
    getUser: getUserMock,
    createUser: createUserMock,
    updateUser: updateUserMock,
    resetPassword: resetPasswordMock,
  })),
}));

vi.mock('../services/LookupHttpClient', () => ({
  LookupHttpClient: vi.fn().mockImplementation(() => ({
    getAll: lookupGetAllMock,
  })),
}));

// ── authAs (manifest-driven, guide-canonical) ───────────────────────────────
type Role = 'MGR' | 'AM' | 'FD' | 'ACCT' | 'OWN';

function claimsForRole(role: Role): ClaimDto[] {
  return (manifest.claims as Array<{ claim: string; grants: string[] }>)
    .filter((c) => c.grants.includes(role))
    .map((c) => ({ type: 'Permission', value: c.claim }));
}

function authAs(opts: { role?: Role; isSystemAdmin?: boolean }): Pinia {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useAuthStore();
  store.user = {
    userId: 1,
    email: 'test@example.com',
    fullName: 'Test User',
    mustChangePassword: false,
    roles: opts.role ? [opts.role] : [],
    claims: opts.role ? claimsForRole(opts.role) : [],
    isSystemAdmin: opts.isSystemAdmin ?? false,
  };
  return pinia;
}

// ── Factories ───────────────────────────────────────────────────────────────
function adminUser(overrides: Partial<AdminUserSummary> = {}): AdminUserSummary {
  return {
    userId: 7,
    firstName: 'Ana',
    lastName: 'Vergara',
    email: 'ana@clinic.pa',
    isActive: true,
    mustChangePassword: false,
    operatorRoles: [{ roleTypeId: 2, name: 'Manager' }],
    identityRoles: [],
    ...overrides,
  };
}

function paged(items: AdminUserSummary[], totalCount = items.length, page = 1) {
  return { items, page, pageSize: 25, totalCount };
}

function roleItem(overrides: Partial<LookupItem> = {}): LookupItem {
  return {
    id: 1, abbreviation: 'X', name: 'Role', description: null, sortOrder: 0,
    createdTimestamp: '2026-01-01', lastUpdatedTimestamp: '2026-01-01',
    ...overrides,
  };
}

// Lookup census: identity roles MUST be filtered out of the picker client-side.
const roleTypeCensus = [
  roleItem({ id: 1, name: 'Patient' }),
  roleItem({ id: 2, name: 'Manager' }),
  roleItem({ id: 3, name: 'Therapist' }),
  roleItem({ id: 4, name: 'Caretaker' }),
  roleItem({ id: 5, name: 'Owner' }),
  roleItem({ id: 6, name: 'SystemAdmin' }),
];

function mountPanel(auth: Pinia) {
  return mount(UsersPanel, {
    global: { plugins: [auth], stubs: { teleport: true } },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Re-seed defaults AFTER clearing (clearAllMocks wipes the seeds).
  getUsersMock.mockResolvedValue(paged([adminUser()]));
  lookupGetAllMock.mockResolvedValue(roleTypeCensus);
  createUserMock.mockResolvedValue(adminUser({ userId: 99, email: 'new@clinic.pa', mustChangePassword: true }));
  updateUserMock.mockResolvedValue(undefined);
  resetPasswordMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

// ── 1. Section visibility (Admin.Users.View) ────────────────────────────────
describe('AdminAccordionNav — Users entry visibility', () => {
  const mountNav = (auth: Pinia) =>
    mount(AdminAccordionNav, { props: { activeSection: 'sites' }, global: { plugins: [auth] } });

  it('shows the Security group + Users entry for MGR (Admin.Users.View)', () => {
    const w = mountNav(authAs({ role: 'MGR' }));
    expect(w.find('[data-testid="nav-group-security"]').exists()).toBe(true);
    expect(w.find('[data-testid="nav-users"]').exists()).toBe(true);
  });

  it('shows the Users entry for OWN and SYSADMIN', () => {
    expect(mountNav(authAs({ role: 'OWN' })).find('[data-testid="nav-users"]').exists()).toBe(true);
    expect(mountNav(authAs({ isSystemAdmin: true })).find('[data-testid="nav-users"]').exists()).toBe(true);
  });

  it('hides the Users entry (and Security group) for FD — no Admin.Users.View', () => {
    const w = mountNav(authAs({ role: 'FD' }));
    expect(w.find('[data-testid="nav-users"]').exists()).toBe(false);
    expect(w.find('[data-testid="nav-group-security"]').exists()).toBe(false);
  });

  it('emits select("users") when the entry is clicked', async () => {
    const w = mountNav(authAs({ isSystemAdmin: true }));
    await w.find('[data-testid="nav-users"]').trigger('click');
    expect(w.emitted('select')).toEqual([['users']]);
  });
});

// ── 2. Read-only vs Manage rendering ────────────────────────────────────────
describe('UsersPanel — View vs Manage gating', () => {
  it('MGR (View only): table renders read-only — no add/edit/reset buttons, read-only note shown', async () => {
    const w = mountPanel(authAs({ role: 'MGR' }));
    await flushPromises();
    expect(w.findAll('[data-testid="users-row"]').length).toBe(1);
    expect(w.find('[data-testid="users-add-button"]').exists()).toBe(false);
    expect(w.find('[data-testid="users-edit-button"]').exists()).toBe(false);
    expect(w.find('[data-testid="users-reset-button"]').exists()).toBe(false);
    expect(w.find('[data-testid="users-readonly-note"]').exists()).toBe(true);
    // Role options feed Manage-gated modals only — a read-only viewer must not fetch them.
    expect(lookupGetAllMock).not.toHaveBeenCalled();
  });

  it('SYSADMIN (Manage): add/edit/reset buttons render and role options load from the role-types lookup', async () => {
    const w = mountPanel(authAs({ isSystemAdmin: true }));
    await flushPromises();
    expect(w.find('[data-testid="users-add-button"]').exists()).toBe(true);
    expect(w.find('[data-testid="users-edit-button"]').exists()).toBe(true);
    expect(w.find('[data-testid="users-reset-button"]').exists()).toBe(true);
    expect(w.find('[data-testid="users-readonly-note"]').exists()).toBe(false);
    expect(lookupGetAllMock).toHaveBeenCalledWith('role-types');
  });

  it('renders role chips, an identity hint, the active badge, and the must-change indicator', async () => {
    getUsersMock.mockResolvedValue(paged([
      adminUser({
        operatorRoles: [{ roleTypeId: 2, name: 'Manager' }, { roleTypeId: 5, name: 'Owner' }],
        identityRoles: ['Patient'],
        isActive: false,
        mustChangePassword: true,
      }),
    ]));
    const w = mountPanel(authAs({ role: 'MGR' }));
    await flushPromises();
    const chips = w.findAll('[data-testid="users-role-chip"]');
    expect(chips.map((c) => c.text())).toEqual(['Manager', 'Owner']);
    expect(w.find('[data-testid="users-identity-hint"]').text()).toContain('also: Patient');
    expect(w.find('[data-testid="users-active-badge"]').text()).toBe('Inactive');
    expect(w.find('[data-testid="users-must-change"]').exists()).toBe(true);
  });
});

// ── 3. Paging + debounced server search (WP-30 wiring) ──────────────────────
describe('UsersPanel — paging and search', () => {
  it('loads page 1 on mount and re-queries on Next', async () => {
    getUsersMock.mockResolvedValue(paged([adminUser()], 60, 1));
    const w = mountPanel(authAs({ role: 'MGR' }));
    await flushPromises();
    expect(getUsersMock).toHaveBeenCalledWith({ search: '', page: 1, pageSize: 25 });
    expect(w.find('[data-testid="users-page-label"]').text()).toContain('Page 1 of 3');

    getUsersMock.mockResolvedValue(paged([adminUser()], 60, 2));
    await w.find('[data-testid="users-next"]').trigger('click');
    await flushPromises();
    expect(getUsersMock).toHaveBeenLastCalledWith({ search: '', page: 2, pageSize: 25 });
  });

  it('debounces search 300ms and restarts from page 1', async () => {
    vi.useFakeTimers();
    getUsersMock.mockResolvedValue(paged([adminUser()], 60, 2));
    const w = mountPanel(authAs({ role: 'MGR' }));
    await flushPromises();

    await w.find('[data-testid="users-search-input"]').setValue('vergara');
    expect(getUsersMock).toHaveBeenCalledTimes(1); // not yet — debounce window open
    vi.advanceTimersByTime(300);
    await flushPromises();
    expect(getUsersMock).toHaveBeenLastCalledWith({ search: 'vergara', page: 1, pageSize: 25 });
  });
});

// ── 4. Create modal ─────────────────────────────────────────────────────────
describe('UsersPanel — create operator modal', () => {
  async function openCreate() {
    const w = mountPanel(authAs({ isSystemAdmin: true }));
    await flushPromises();
    await w.find('[data-testid="users-add-button"]').trigger('click');
    await flushPromises();
    return w;
  }

  it('offers ONLY operator roles — identity roles (Patient/Therapist/Caretaker) are filtered out', async () => {
    const w = await openCreate();
    // Option labels wrap the checkboxes — read the label text of each rendered option.
    const labels = w.findAll('[data-testid="user-create-role-option"]').map((o) => {
      const label = o.element.closest('label');
      return label ? label.textContent?.trim() : '';
    });
    expect(labels).toEqual(['Manager', 'Owner', 'SystemAdmin']); // ids 1/3/4 (identity) filtered out
  });

  it('validates: short temp password and empty role set never reach the API', async () => {
    const w = await openCreate();
    await w.find('[data-testid="user-create-first-name"]').setValue('Nadia');
    await w.find('[data-testid="user-create-last-name"]').setValue('Rios');
    await w.find('[data-testid="user-create-email"]').setValue('nadia@clinic.pa');
    await w.find('[data-testid="user-create-temp-password"]').setValue('short');
    await w.find('[data-testid="user-create-submit"]').trigger('click');
    expect(w.text()).toContain('The temporary password must be at least 8 characters long.');
    expect(createUserMock).not.toHaveBeenCalled();

    await w.find('[data-testid="user-create-temp-password"]').setValue('longenough1');
    await w.find('[data-testid="user-create-submit"]').trigger('click');
    expect(w.text()).toContain('Select at least one operator role.');
    expect(createUserMock).not.toHaveBeenCalled();
  });

  it('posts the exact contract payload (operatorRoleTypeIds) and shows the success banner', async () => {
    const w = await openCreate();
    await w.find('[data-testid="user-create-first-name"]').setValue('Nadia');
    await w.find('[data-testid="user-create-last-name"]').setValue('Rios');
    await w.find('[data-testid="user-create-email"]').setValue('nadia@clinic.pa');
    await w.find('[data-testid="user-create-temp-password"]').setValue('Temp1234!');
    await w.findAll('[data-testid="user-create-role-option"]')[0].setValue(true); // Manager (id 2)
    await w.find('[data-testid="user-create-submit"]').trigger('click');
    await vi.waitFor(() => expect(createUserMock).toHaveBeenCalled());
    expect(createUserMock).toHaveBeenCalledWith({
      firstName: 'Nadia',
      lastName: 'Rios',
      email: 'nadia@clinic.pa',
      tempPassword: 'Temp1234!',
      operatorRoleTypeIds: [2],
    });
    await flushPromises();
    expect(w.find('[data-testid="users-success-banner"]').text()).toContain('new@clinic.pa');
    expect(getUsersMock).toHaveBeenCalledTimes(2); // reload after create
  });

  it('surfaces the duplicate-email 409 message verbatim', async () => {
    createUserMock.mockRejectedValue(new Error('A user with this email address already exists.'));
    const w = await openCreate();
    await w.find('[data-testid="user-create-first-name"]').setValue('Nadia');
    await w.find('[data-testid="user-create-last-name"]').setValue('Rios');
    await w.find('[data-testid="user-create-email"]').setValue('ana@clinic.pa');
    await w.find('[data-testid="user-create-temp-password"]').setValue('Temp1234!');
    await w.findAll('[data-testid="user-create-role-option"]')[0].setValue(true);
    await w.find('[data-testid="user-create-submit"]').trigger('click');
    await flushPromises();
    expect(w.text()).toContain('A user with this email address already exists.');
  });
});

// ── 5. Edit modal (omitted-unchanged PUT semantics + guard rails) ───────────
describe('UsersPanel — edit modal', () => {
  async function openEdit() {
    const w = mountPanel(authAs({ isSystemAdmin: true }));
    await flushPromises();
    await w.find('[data-testid="users-edit-button"]').trigger('click');
    await flushPromises();
    return w;
  }

  it('active toggled only → payload is EXACTLY { isActive } (roles omitted = unchanged)', async () => {
    const w = await openEdit();
    await w.find('[data-testid="user-edit-active-toggle"]').setValue(false);
    await w.find('[data-testid="user-edit-submit"]').trigger('click');
    await vi.waitFor(() => expect(updateUserMock).toHaveBeenCalled());
    expect(updateUserMock).toHaveBeenCalledWith(7, { isActive: false });
  });

  it('roles changed only → payload is EXACTLY { operatorRoleTypeIds } (isActive omitted)', async () => {
    const w = await openEdit();
    // Options are Manager(2, already held), Owner(5), SystemAdmin(6) — add Owner.
    await w.findAll('[data-testid="user-edit-role-option"]')[1].setValue(true);
    await w.find('[data-testid="user-edit-submit"]').trigger('click');
    await vi.waitFor(() => expect(updateUserMock).toHaveBeenCalled());
    expect(updateUserMock).toHaveBeenCalledWith(7, { operatorRoleTypeIds: [2, 5] });
  });

  it('nothing changed → no PUT at all, modal just closes', async () => {
    const w = await openEdit();
    await w.find('[data-testid="user-edit-submit"]').trigger('click');
    await flushPromises();
    expect(updateUserMock).not.toHaveBeenCalled();
    expect(w.find('[data-testid="user-edit-form"]').exists()).toBe(false);
  });

  it('guard-rail 400 detail strings surface VERBATIM (self-deactivate example)', async () => {
    updateUserMock.mockRejectedValue(new Error('You cannot deactivate your own account.'));
    const w = await openEdit();
    await w.find('[data-testid="user-edit-active-toggle"]').setValue(false);
    await w.find('[data-testid="user-edit-submit"]').trigger('click');
    await flushPromises();
    expect(w.text()).toContain('You cannot deactivate your own account.');
    // Modal stays open so the admin can correct course.
    expect(w.find('[data-testid="user-edit-form"]').exists()).toBe(true);
  });

  it('last-SYSADMIN guard rail surfaces verbatim too', async () => {
    updateUserMock.mockRejectedValue(new Error('This change would leave the system with no active SystemAdmin account.'));
    const w = await openEdit();
    await w.find('[data-testid="user-edit-active-toggle"]').setValue(false);
    await w.find('[data-testid="user-edit-submit"]').trigger('click');
    await flushPromises();
    expect(w.text()).toContain('This change would leave the system with no active SystemAdmin account.');
  });
});

// ── 6. Reset-password modal ─────────────────────────────────────────────────
describe('UsersPanel — reset-password modal', () => {
  async function openReset() {
    const w = mountPanel(authAs({ isSystemAdmin: true }));
    await flushPromises();
    await w.find('[data-testid="users-reset-button"]').trigger('click');
    await flushPromises();
    return w;
  }

  it('validates min-8 and confirm match before calling the API', async () => {
    const w = await openReset();
    await w.find('[data-testid="user-reset-temp-password"]').setValue('short');
    await w.find('[data-testid="user-reset-confirm-password"]').setValue('short');
    await w.find('[data-testid="user-reset-submit"]').trigger('click');
    expect(w.text()).toContain('The temporary password must be at least 8 characters long.');
    expect(resetPasswordMock).not.toHaveBeenCalled();

    await w.find('[data-testid="user-reset-temp-password"]').setValue('Temp1234!');
    await w.find('[data-testid="user-reset-confirm-password"]').setValue('Temp1234?');
    await w.find('[data-testid="user-reset-submit"]').trigger('click');
    expect(w.text()).toContain('Passwords do not match.');
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it('resets, then explains the forced change at next login in the success banner', async () => {
    const w = await openReset();
    await w.find('[data-testid="user-reset-temp-password"]').setValue('Temp1234!');
    await w.find('[data-testid="user-reset-confirm-password"]').setValue('Temp1234!');
    await w.find('[data-testid="user-reset-submit"]').trigger('click');
    await vi.waitFor(() => expect(resetPasswordMock).toHaveBeenCalledWith(7, 'Temp1234!'));
    await flushPromises();
    const banner = w.find('[data-testid="users-success-banner"]');
    expect(banner.text()).toContain('ana@clinic.pa');
    expect(banner.text()).toContain('must change it at next login');
  });
});

// ── 7. P1 sticky sidebar ────────────────────────────────────────────────────
describe('O2Sidebar — sticky/self-scrolling (P1)', () => {
  it('pins the sidebar (md:sticky + viewport-bounded + self-scroll) without touching mobile classes', async () => {
    const pinia = authAs({ role: 'MGR' });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:rest(.*)*', component: { template: '<div/>' } }],
    });
    router.push('/');
    await router.isReady();
    const w = mount(O2Sidebar, {
      global: { plugins: [pinia, router], stubs: { 'font-awesome-icon': true } },
    });
    const aside = w.find('[data-testid="o2-sidebar"]');
    // Sticky fix: pinned to the viewport and independently scrollable on long pages.
    expect(aside.classes()).toContain('md:sticky');
    expect(aside.classes()).toContain('md:top-0');
    expect(aside.classes()).toContain('md:h-screen');
    expect(aside.classes()).toContain('md:overflow-y-auto');
    expect(aside.classes()).toContain('shrink-0');
    // Mobile layout untouched: still hidden below md (O2MobileNav owns small screens).
    expect(aside.classes()).toContain('hidden');
    expect(aside.classes()).toContain('md:flex');
  });
});
