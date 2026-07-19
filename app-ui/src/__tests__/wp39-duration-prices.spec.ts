// WP-39 (PR-1/2/3) — per-duration specialty price sheet + on-site flag + price-edit roles:
//   PR-1 — SpecialtyPricesModal (G5): current-effective 5-duration grid, append-only new rows
//          (EffectiveFrom, default today, future allowed), expandable read-only history,
//          G6 soft missing-60-min warning, friendly 409 message.
//   PR-2 — On-site column (read-only, everyone) + "Offered on-site" checkbox (structural
//          Admin.Lookups.SpecialtyType.Manage — SYSADMIN only); Site gains the trip charge.
//   PR-3 — prices action (fa-tags icon button, "Edit pricing tables") rides the NEW
//          Specialties.Prices.Edit (MGR/AM + SYSADMIN);
//          AM-reachability: /admin now opens on Admin.View, and AM sees ONLY Specialty Types.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia, type Pinia } from 'pinia';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import type { RouteLocationNormalized } from 'vue-router';
import manifest from '../generated/access-control-matrix.json';
import { Permissions } from '../generated/permissions';
import { accessGuard } from '../router';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import type { SpecialtyPriceHistory } from '../interfaces/Lookups';
import type { Site } from '../interfaces/Site';
import SpecialtyPricesModal from '../components/admin/SpecialtyPricesModal.vue';
import AdminAccordionNav from '../components/admin/AdminAccordionNav.vue';
import LookupTableManager, { type ColumnDef } from '../components/admin/LookupTableManager.vue';
import LookupFormModal, { type FieldDef } from '../components/admin/LookupFormModal.vue';
import SiteFormModal from '../components/sites/SiteFormModal.vue';
import AdminView from '../views/AdminView.vue';

// ── hoisted client mocks ─────────────────────────────────────────────────────

const { lookupClientMocks, sitesClientMocks } = vi.hoisted(() => ({
  lookupClientMocks: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    getSpecialtyPrices: vi.fn(),
    putSpecialtyPrices: vi.fn(),
  },
  sitesClientMocks: {
    getSites: vi.fn(),
    createSite: vi.fn(),
    updateSite: vi.fn(),
  },
}));

vi.mock('../services/LookupHttpClient', () => ({
  LookupHttpClient: vi.fn().mockImplementation(() => ({
    getAll: lookupClientMocks.getAll,
    create: lookupClientMocks.create,
    update: lookupClientMocks.update,
    getSpecialtyPrices: lookupClientMocks.getSpecialtyPrices,
    putSpecialtyPrices: lookupClientMocks.putSpecialtyPrices,
  })),
}));

vi.mock('../services/SitesHttpClient', () => ({
  SitesHttpClient: vi.fn().mockImplementation(() => ({
    getSites: sitesClientMocks.getSites,
    createSite: sitesClientMocks.createSite,
    updateSite: sitesClientMocks.updateSite,
  })),
}));

// ── auth helpers (manifest-driven, per testing guide) ────────────────────────

function claimsForRole(role: string): ClaimDto[] {
  return (manifest.claims as Array<{ claim: string; grants: string[] }>)
    .filter((c) => c.grants.includes(role))
    .map((c) => ({ type: 'Permission', value: c.claim }));
}

function authAs(role: string, opts: { isSystemAdmin?: boolean } = {}): Pinia {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useAuthStore();
  store.user = {
    userId: 1, email: 'test@example.com', fullName: 'Test User',
    mustChangePassword: false, roles: [role], claims: claimsForRole(role),
    isSystemAdmin: opts.isSystemAdmin ?? false,
  };
  return pinia;
}

// ── factories ────────────────────────────────────────────────────────────────

function specialty(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 6, abbreviation: 'TL', name: 'Language Therapy', description: null, sortOrder: 1,
    defaultAmount: 40, offeredOnSite: true,
    durationPrices: [{ durationMinutes: 60, amount: 45, effectiveFrom: '2026-06-01' }],
    createdTimestamp: '', lastUpdatedTimestamp: '',
    ...overrides,
  };
}

function priceHistory(overrides: Partial<SpecialtyPriceHistory> = {}): SpecialtyPriceHistory {
  return {
    specialtyTypeId: 6,
    defaultAmount: 40,
    offeredOnSite: true,
    prices: [
      { durationMinutes: 30, amount: 25, effectiveFrom: '2026-07-01', isCurrent: true },
      { durationMinutes: 30, amount: 22, effectiveFrom: '2026-01-01', isCurrent: false },
      { durationMinutes: 60, amount: 45, effectiveFrom: '2026-06-01', isCurrent: true },
    ],
    ...overrides,
  };
}

function site(overrides: Partial<Site> = {}): Site {
  return {
    siteId: 1, siteName: 'Main Clinic', ruc: '123', inceptionDate: '2020-01-15',
    address: 'Somewhere', latitude: null, longitude: null,
    idleLogoffMinutes: 60, onSiteTripChargeAmount: 0,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  lookupClientMocks.getAll.mockResolvedValue([specialty()]);
  lookupClientMocks.getSpecialtyPrices.mockResolvedValue(priceHistory());
  lookupClientMocks.putSpecialtyPrices.mockResolvedValue(undefined);
  sitesClientMocks.getSites.mockResolvedValue([site()]);
  sitesClientMocks.updateSite.mockResolvedValue(undefined);
  sitesClientMocks.createSite.mockResolvedValue(site());
});

// ── SpecialtyPricesModal (G5) ────────────────────────────────────────────────

async function openPricesModal(pinia: Pinia, sp = specialty()) {
  const wrapper = mount(SpecialtyPricesModal, {
    props: { visible: false, specialty: sp as never },
    global: { plugins: [pinia], stubs: { teleport: true } },
  });
  await wrapper.setProps({ visible: true });
  await flushPromises();
  return wrapper;
}

describe('SpecialtyPricesModal — current prices + history', () => {
  it('renders the 5-duration grid with current-effective prices and dashes for missing ones', async () => {
    const wrapper = await openPricesModal(authAs('MGR'));

    expect(lookupClientMocks.getSpecialtyPrices).toHaveBeenCalledWith(6);
    for (const d of [30, 45, 60, 90, 120]) {
      expect(wrapper.find(`[data-testid="specialty-prices-row-${d}"]`).exists()).toBe(true);
    }
    expect(wrapper.find('[data-testid="specialty-prices-current-30"]').text()).toContain('25.00');
    expect(wrapper.find('[data-testid="specialty-prices-current-30"]').text()).toContain('2026-07-01');
    expect(wrapper.find('[data-testid="specialty-prices-current-60"]').text()).toContain('45.00');
    expect(wrapper.find('[data-testid="specialty-prices-current-45"]').text()).toContain('—');
    // defaultAmount fallback noted for durations with no effective price
    expect(wrapper.find('[data-testid="specialty-prices-default-note"]').text()).toContain('40.00');
  });

  it('expands the read-only per-duration history with the current row flagged', async () => {
    const wrapper = await openPricesModal(authAs('MGR'));

    expect(wrapper.find('[data-testid="specialty-prices-history-30"]').exists()).toBe(false);
    await wrapper.find('[data-testid="specialty-prices-history-toggle-30"]').trigger('click');
    const history = wrapper.find('[data-testid="specialty-prices-history-30"]');
    expect(history.exists()).toBe(true);
    expect(history.text()).toContain('2026-07-01');
    expect(history.text()).toContain('2026-01-01');
    expect(history.text()).toContain('current'); // isCurrent highlight
    // 45-min has no history at all → no toggle
    expect(wrapper.find('[data-testid="specialty-prices-history-toggle-45"]').exists()).toBe(false);
  });

  it('G6: warns (softly) when there is no current-effective 60-min price', async () => {
    lookupClientMocks.getSpecialtyPrices.mockResolvedValue(priceHistory({
      prices: [{ durationMinutes: 30, amount: 25, effectiveFrom: '2026-07-01', isCurrent: true }],
    }));
    const wrapper = await openPricesModal(authAs('MGR'));
    expect(wrapper.find('[data-testid="specialty-prices-warning-60"]').exists()).toBe(true);
    // nothing blocking: entering a new price is still possible
    expect(wrapper.find('[data-testid="specialty-prices-amount-input-60"]').exists()).toBe(true);
  });

  it('G6: no warning when a current 60-min price exists', async () => {
    const wrapper = await openPricesModal(authAs('MGR'));
    expect(wrapper.find('[data-testid="specialty-prices-warning-60"]').exists()).toBe(false);
  });
});

describe('SpecialtyPricesModal — append flow', () => {
  it('PUTs exactly the typed rows (append-only) and emits saved + close', async () => {
    const wrapper = await openPricesModal(authAs('AM'));

    await wrapper.find('[data-testid="specialty-prices-amount-input-60"]').setValue('47.50');
    await wrapper.find('[data-testid="specialty-prices-date-input-60"]').setValue('2026-08-01');
    await wrapper.find('[data-testid="specialty-prices-amount-input-90"]').setValue('70');
    await wrapper.find('[data-testid="specialty-prices-date-input-90"]').setValue('2026-07-19');
    await wrapper.find('[data-testid="specialty-prices-save"]').trigger('click');

    await vi.waitFor(() => expect(lookupClientMocks.putSpecialtyPrices).toHaveBeenCalled());
    expect(lookupClientMocks.putSpecialtyPrices).toHaveBeenCalledWith(6, {
      prices: [
        { durationMinutes: 60, amount: 47.5, effectiveFrom: '2026-08-01' },
        { durationMinutes: 90, amount: 70, effectiveFrom: '2026-07-19' },
      ],
    });
    expect(wrapper.emitted('saved')).toHaveLength(1);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('defaults each EffectiveFrom to today and disables Save until an amount is typed', async () => {
    const wrapper = await openPricesModal(authAs('MGR'));

    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect((wrapper.find('[data-testid="specialty-prices-date-input-60"]').element as HTMLInputElement).value).toBe(iso);

    expect((wrapper.find('[data-testid="specialty-prices-save"]').element as HTMLButtonElement).disabled).toBe(true);
    await wrapper.find('[data-testid="specialty-prices-amount-input-60"]').setValue('45');
    // re-find after the re-render: the teleport STUB recreates slot children, so a node handle
    // captured before setValue goes stale (stub artifact, not an app bug — see testing guide).
    expect((wrapper.find('[data-testid="specialty-prices-save"]').element as HTMLButtonElement).disabled).toBe(false);
  });

  it('rejects a negative amount client-side without calling the API', async () => {
    const wrapper = await openPricesModal(authAs('MGR'));

    await wrapper.find('[data-testid="specialty-prices-amount-input-30"]').setValue('-5');
    await wrapper.find('[data-testid="specialty-prices-save"]').trigger('click');
    await flushPromises();

    expect(lookupClientMocks.putSpecialtyPrices).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('must be a number ≥ 0');
  });

  it('surfaces a duplicate (duration, effective-from) 409 as a friendly message', async () => {
    lookupClientMocks.putSpecialtyPrices.mockRejectedValueOnce(
      new Error('Conflict: a price for (60, 2026-08-01) already exists'),
    );
    const wrapper = await openPricesModal(authAs('MGR'));

    await wrapper.find('[data-testid="specialty-prices-amount-input-60"]').setValue('47.50');
    await wrapper.find('[data-testid="specialty-prices-save"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('already exists — pick a different date');
    expect(wrapper.emitted('saved')).toBeUndefined();
  });
});

// ── AdminView — claim-gated Prices action / manage split ─────────────────────

const ADMIN_STUBS = {
  O2MobileNav: true, O2Sidebar: true, O2Header: true, O2Footer: true,
  AdminAccordionNav: true, SiteList: true, SiteFormModal: true,
  LookupTableManager: true, LookupFormModal: true, SpecialtyPricesModal: true,
  AboutPanel: true, PatientMergePanel: true,
};

async function mountAdmin(pinia: Pinia, section?: string) {
  const wrapper = mount(AdminView, { global: { plugins: [pinia], stubs: ADMIN_STUBS } });
  if (section) {
    (wrapper.vm as unknown as { activeSection: string }).activeSection = section;
    await nextTick();
  }
  await flushPromises();
  return wrapper;
}

describe('AdminView — Prices action claim gating (Specialties.Prices.Edit)', () => {
  const managerProps = async (role: string, opts: { isSystemAdmin?: boolean } = {}) => {
    const wrapper = await mountAdmin(authAs(role, opts), 'specialty-types');
    const manager = wrapper.findComponent({ name: 'LookupTableManager' });
    return manager.props() as { showPricesAction: boolean; canManage: boolean; columns: Array<{ key: string }> };
  };

  it('MGR sees the Prices action but no structural Add/Edit', async () => {
    const props = await managerProps('MGR');
    expect(props.showPricesAction).toBe(true);
    expect(props.canManage).toBe(false);
  });

  it('AM sees the Prices action but no structural Add/Edit', async () => {
    const props = await managerProps('AM');
    expect(props.showPricesAction).toBe(true);
    expect(props.canManage).toBe(false);
  });

  it('FD gets neither (no Specialties.Prices.Edit, no Manage)', async () => {
    const props = await managerProps('FD');
    expect(props.showPricesAction).toBe(false);
    expect(props.canManage).toBe(false);
  });

  it('OWN can read the section but not edit prices', async () => {
    const props = await managerProps('OWN');
    expect(props.showPricesAction).toBe(false);
    expect(props.canManage).toBe(false);
  });

  it('SYSADMIN (wildcard) gets both Prices and structural manage', async () => {
    const props = await managerProps('SYSADMIN', { isSystemAdmin: true });
    expect(props.showPricesAction).toBe(true);
    expect(props.canManage).toBe(true);
  });

  it('specialty-types gains the read-only On-site column (display projection)', async () => {
    const wrapper = await mountAdmin(authAs('MGR'), 'specialty-types');
    const manager = wrapper.findComponent({ name: 'LookupTableManager' });
    const keys = (manager.props('columns') as Array<{ key: string }>).map((c) => c.key);
    expect(keys).toContain('offeredOnSiteDisplay');
    const items = manager.props('items') as Array<Record<string, unknown>>;
    expect(items[0].offeredOnSiteDisplay).toBe('Yes');
  });

  it('AM lands on Specialty Types (no Sites claim → no sites fetch, no default sites section)', async () => {
    const wrapper = await mountAdmin(authAs('AM'));
    expect((wrapper.vm as unknown as { activeSection: string }).activeSection).toBe('specialty-types');
    expect(sitesClientMocks.getSites).not.toHaveBeenCalled();
    // and only the specialty-types lookup is fetched — the other three are claim-skipped
    expect(lookupClientMocks.getAll).toHaveBeenCalledWith('specialty-types');
    expect(lookupClientMocks.getAll).not.toHaveBeenCalledWith('payment-types');
    expect(lookupClientMocks.getAll).not.toHaveBeenCalledWith('role-types');
    expect(lookupClientMocks.getAll).not.toHaveBeenCalledWith('appointment-statuses');
  });

  it('MGR lands on Sites (holds Admin.Sites.View)', async () => {
    const wrapper = await mountAdmin(authAs('MGR'));
    expect((wrapper.vm as unknown as { activeSection: string }).activeSection).toBe('sites');
    expect(sitesClientMocks.getSites).toHaveBeenCalled();
  });
});

describe('AdminView — On-site checkbox is SYSADMIN-only (structural manage)', () => {
  const specialtyFormFields = async (pinia: Pinia) => {
    const wrapper = await mountAdmin(pinia, 'specialty-types');
    (wrapper.vm as unknown as { crudMap: Record<string, { openAdd: () => void }> })
      .crudMap['specialty-types'].openAdd();
    await nextTick();
    const modal = wrapper.findComponent({ name: 'LookupFormModal' });
    return (modal.props('fields') as FieldDef[]).map((f) => f.key);
  };

  it('SYSADMIN: the specialty form offers the Offered on-site checkbox', async () => {
    const keys = await specialtyFormFields(authAs('SYSADMIN', { isSystemAdmin: true }));
    expect(keys).toContain('offeredOnSite');
    expect(keys).toContain('defaultAmount');
  });

  it('MGR: no Offered on-site field (Manage claim missing)', async () => {
    const keys = await specialtyFormFields(authAs('MGR'));
    expect(keys).not.toContain('offeredOnSite');
  });
});

describe('LookupFormModal — checkbox field plumbing', () => {
  const fields: FieldDef[] = [
    { key: 'name', label: 'Name', required: true },
    { key: 'offeredOnSite', label: 'Offered on-site', type: 'checkbox' },
  ];

  it('renders the checkbox from initial values and submits an explicit boolean', async () => {
    const wrapper = mount(LookupFormModal, {
      props: { visible: false, title: 'Edit Specialty', fields, initialValues: { name: 'TL', offeredOnSite: 'true' } },
      global: { plugins: [authAs('SYSADMIN', { isSystemAdmin: true })], stubs: { teleport: true } },
    });
    await wrapper.setProps({ visible: true });
    await nextTick();

    const checkbox = wrapper.find('[data-testid="lookup-form-offeredOnSite-checkbox"]');
    expect((checkbox.element as HTMLInputElement).checked).toBe(true);

    await checkbox.setValue(false);
    await wrapper.find('form').trigger('submit');
    const submitted = wrapper.emitted('submit')![0][0] as Record<string, unknown>;
    expect(submitted.offeredOnSite).toBe(false); // unchecked = explicit false, not omitted
    expect(submitted.name).toBe('TL');
  });

  it('shows the Sort Order helper line explaining display-order semantics', async () => {
    const wrapper = mount(LookupFormModal, {
      props: {
        visible: false,
        title: 'Add Status',
        fields: [
          { key: 'name', label: 'Name', required: true },
          { key: 'sortOrder', label: 'Sort Order', type: 'number', helper: 'Items display in ascending order; ties sort alphabetically.' },
        ] as FieldDef[],
        initialValues: null,
      },
      global: { plugins: [authAs('SYSADMIN', { isSystemAdmin: true })], stubs: { teleport: true } },
    });
    await wrapper.setProps({ visible: true });
    await nextTick();

    const helper = wrapper.find('[data-testid="lookup-form-sortOrder-helper"]');
    expect(helper.exists()).toBe(true);
    expect(helper.text()).toBe('Items display in ascending order; ties sort alphabetically.');
  });
});

// ── AdminAccordionNav — AM sees ONLY Specialty Types ─────────────────────────

describe('AdminAccordionNav — per-claim section visibility', () => {
  const mountNav = (pinia: Pinia) =>
    mount(AdminAccordionNav, { props: { activeSection: 'specialty-types' }, global: { plugins: [pinia] } });

  it('AM: only the Specialty Types entry — no Sites, other lookups, merge, security, or about', () => {
    const w = mountNav(authAs('AM'));
    expect(w.find('[data-testid="nav-specialty-types"]').exists()).toBe(true);
    expect(w.find('[data-testid="nav-group-configuration"]').exists()).toBe(false);
    expect(w.find('[data-testid="nav-sites"]').exists()).toBe(false);
    expect(w.find('[data-testid="nav-appointment-statuses"]').exists()).toBe(false);
    expect(w.find('[data-testid="nav-payment-types"]').exists()).toBe(false);
    expect(w.find('[data-testid="nav-role-types"]').exists()).toBe(false);
    expect(w.find('[data-testid="nav-group-data-maintenance"]').exists()).toBe(false);
    expect(w.find('[data-testid="nav-group-security"]').exists()).toBe(false);
    expect(w.find('[data-testid="nav-group-about"]').exists()).toBe(false);
  });

  it('MGR: Sites + all four lookup tables, but no merge/security/about (SYSADMIN-only)', () => {
    const w = mountNav(authAs('MGR'));
    expect(w.find('[data-testid="nav-sites"]').exists()).toBe(true);
    expect(w.find('[data-testid="nav-specialty-types"]').exists()).toBe(true);
    expect(w.find('[data-testid="nav-payment-types"]').exists()).toBe(true);
    expect(w.find('[data-testid="nav-group-data-maintenance"]').exists()).toBe(false);
    expect(w.find('[data-testid="nav-group-security"]').exists()).toBe(false);
    expect(w.find('[data-testid="nav-group-about"]').exists()).toBe(false);
  });

  it('SYSADMIN: everything, including merge, security, and about', () => {
    const w = mountNav(authAs('SYSADMIN', { isSystemAdmin: true }));
    expect(w.find('[data-testid="nav-sites"]').exists()).toBe(true);
    expect(w.find('[data-testid="nav-specialty-types"]').exists()).toBe(true);
    expect(w.find('[data-testid="nav-group-data-maintenance"]').exists()).toBe(true);
    expect(w.find('[data-testid="nav-group-security"]').exists()).toBe(true);
    expect(w.find('[data-testid="nav-group-about"]').exists()).toBe(true);
  });
});

// ── Router guard — /admin now rides Admin.View ───────────────────────────────

describe('accessGuard — /admin opens on Admin.View (WP-39C)', () => {
  function guardAuthAs(role?: string, isSystemAdmin = false) {
    setActivePinia(createPinia());
    const store = useAuthStore();
    store.initialized = true;
    store.accessToken = 'test-token';
    store.user = {
      userId: 1, email: 'test@example.com', fullName: 'Test User',
      mustChangePassword: false, roles: role ? [role] : [],
      claims: role ? claimsForRole(role) : [], isSystemAdmin,
    };
  }
  const adminRoute = () =>
    ({ name: 'admin', fullPath: '/admin', meta: { permission: Permissions.AdminView } }) as unknown as RouteLocationNormalized;

  it('lets AM into /admin (reachability grant)', async () => {
    guardAuthAs('AM');
    expect(await accessGuard(adminRoute())).toBe(true);
  });

  it('lets MGR and SYSADMIN into /admin', async () => {
    guardAuthAs('MGR');
    expect(await accessGuard(adminRoute())).toBe(true);
    guardAuthAs(undefined, true);
    expect(await accessGuard(adminRoute())).toBe(true);
  });

  it('redirects FD (no Admin.View) to its landing page', async () => {
    guardAuthAs('FD');
    expect(await accessGuard(adminRoute())).toMatchObject({ name: 'dashboard' });
  });
});

// ── LookupTableManager — header sorting (WP-39 follow-up) ────────────────────

describe('LookupTableManager — SortOrder default + Name on-demand sorting', () => {
  const columns: ColumnDef[] = [
    { key: 'abbreviation', label: 'Abbreviation', primary: true },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'sortOrder', label: '#' }, // owner ruling: muted "#" utility column
  ];
  // Deliberately shuffled: equal SortOrder 1 must tiebreak by case-insensitive name
  // ("alpha" < "Beta"), mirroring the server's ORDER BY SortOrder ASC, Name ASC.
  const items = [
    { id: 1, abbreviation: 'ZT', name: 'Zeta', description: null, sortOrder: 2 },
    { id: 2, abbreviation: 'BT', name: 'Beta', description: null, sortOrder: 1 },
    { id: 3, abbreviation: 'AL', name: 'alpha', description: null, sortOrder: 1 },
  ];

  const mountManager = () =>
    mount(LookupTableManager, {
      props: {
        title: 'Payment Types', subtitle: 'test', addButtonLabel: 'Add',
        columns, idKey: 'id', items,
      },
    });
  const namesShown = (w: ReturnType<typeof mountManager>) =>
    w.findAll('tbody tr').map((r) => r.findAll('td')[2].text());

  it('defaults to SortOrder ASC with case-insensitive Name tiebreak, indicator on Sort Order', () => {
    const w = mountManager();
    expect(namesShown(w)).toEqual(['alpha', 'Beta', 'Zeta']);
    const indicator = w.find('[data-testid="lookup-sort-header-sort-order"] [data-testid="lookup-sort-indicator"]');
    expect(indicator.exists()).toBe(true);
    expect(indicator.text()).toBe('▲');
  });

  it('Name click sorts by name ASC (case-insensitive); second click reverses', async () => {
    const w = mountManager();
    await w.find('[data-testid="lookup-sort-header-name"]').trigger('click');
    expect(namesShown(w)).toEqual(['alpha', 'Beta', 'Zeta']);
    expect(w.find('[data-testid="lookup-sort-header-name"] [data-testid="lookup-sort-indicator"]').text()).toBe('▲');

    await w.find('[data-testid="lookup-sort-header-name"]').trigger('click');
    expect(namesShown(w)).toEqual(['Zeta', 'Beta', 'alpha']);
    expect(w.find('[data-testid="lookup-sort-header-name"] [data-testid="lookup-sort-indicator"]').text()).toBe('▼');
  });

  it('Sort Order click restores the default order from a Name sort', async () => {
    const w = mountManager();
    await w.find('[data-testid="lookup-sort-header-name"]').trigger('click');
    await w.find('[data-testid="lookup-sort-header-name"]').trigger('click'); // name DESC
    await w.find('[data-testid="lookup-sort-header-sort-order"]').trigger('click');
    expect(namesShown(w)).toEqual(['alpha', 'Beta', 'Zeta']); // SortOrder ASC + name tiebreak
    expect(w.find('[data-testid="lookup-sort-header-sort-order"] [data-testid="lookup-sort-indicator"]').text()).toBe('▲');
  });

  it('non-sortable headers (Abbreviation/Description) have no sort affordance', () => {
    const w = mountManager();
    expect(w.find('[data-testid="lookup-sort-header-abbreviation"]').exists()).toBe(false);
    expect(w.find('[data-testid="lookup-sort-header-description"]').exists()).toBe(false);
  });

  // Owner ruling: Sort Order is machinery, not content — narrow "#" header with a tooltip,
  // muted cells, but still the click target restoring the default order (covered above).
  it('renders the sortOrder column as a "#" utility header with a "Sort order" tooltip', () => {
    const w = mountManager();
    const header = w.find('[data-testid="lookup-sort-header-sort-order"]');
    expect(header.text()).toContain('#');
    expect(header.text()).not.toContain('Sort Order'); // demoted — no full label
    expect(header.attributes('title')).toBe('Sort order');
  });

  it('mutes the sortOrder cells (small + subdued text idiom)', () => {
    const w = mountManager();
    const cells = w.findAll('[data-testid="lookup-sort-order-cell"]');
    expect(cells).toHaveLength(3);
    for (const cell of cells) {
      expect(cell.classes()).toContain('text-xs');
      expect(cell.classes()).toContain('text-slate-400');
    }
  });

  // Owner ruling: the prices action is an ICON button (fa-tags — price tags, not a bare $
  // that could read as the nearby Default $ column), named for hover + screen readers.
  it('renders the prices action as a tags icon button with tooltip and aria-label', async () => {
    const w = mount(LookupTableManager, {
      props: {
        title: 'Specialty Types', subtitle: 'test', addButtonLabel: 'Add',
        columns, idKey: 'id', items, showPricesAction: true,
      },
    });
    const action = w.find('[data-testid="specialty-prices-action"]');
    expect(action.exists()).toBe(true);
    expect(action.attributes('title')).toBe('Edit pricing tables');
    expect(action.attributes('aria-label')).toBe('Edit pricing tables');
    expect(action.text()).toBe(''); // icon-only — no "Prices…" text label
    expect(action.find('svg').exists()).toBe(true); // the registered fa-tags icon

    await action.trigger('click');
    expect(w.emitted('prices')).toHaveLength(1);
    // first RENDERED row = 'alpha' (id 3) — rows are default-sorted, not input-ordered
    expect((w.emitted('prices')![0][0] as { id: number }).id).toBe(3);
  });
});

// ── SiteFormModal — on-site trip charge field (WP-32 pattern) ────────────────

describe('SiteFormModal — onSiteTripChargeAmount', () => {
  async function openEdit(s: Site) {
    const wrapper = mount(SiteFormModal, {
      props: { visible: false, site: s },
      global: { plugins: [authAs('SYSADMIN', { isSystemAdmin: true })], stubs: { teleport: true } },
    });
    await wrapper.setProps({ visible: true });
    await flushPromises();
    return wrapper;
  }

  it('renders the stored trip charge and sends the edited value on submit', async () => {
    const wrapper = await openEdit(site({ onSiteTripChargeAmount: 12.5 }));
    const input = wrapper.find('[data-testid="site-trip-charge-input"]');
    expect((input.element as HTMLInputElement).value).toBe('12.5');

    await input.setValue('20');
    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(sitesClientMocks.updateSite).toHaveBeenCalled());
    expect(sitesClientMocks.updateSite).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ onSiteTripChargeAmount: 20 }),
    );
  });

  it('rejects a negative trip charge client-side (API would 400 anyway)', async () => {
    const wrapper = await openEdit(site());
    await wrapper.find('[data-testid="site-trip-charge-input"]').setValue('-1');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(sitesClientMocks.updateSite).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('greater than or equal to 0');
  });
});
