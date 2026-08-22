// WP-54C — SYSADMIN entity change log UI.
//
// Covers:
//  - Nav: the Change Log entry is SYSADMIN-only (Admin.ChangeLog.View); MGR does not see it.
//  - Panel loads summary + list on mount (DateRangeQuickFilter emits 'today'), by-user leads.
//  - Clicking a by-user row filters the detail (re-queries the list with that userId).
//  - Changing the period group re-queries the summary with the new groupBy.
//  - Expandable row lists the changed field NAMES (never a value).
//  - Print / Save as PDF calls window.print.
//  - A rejected client surfaces the error banner.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia, type Pinia } from 'pinia';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import AdminAccordionNav from '../components/admin/AdminAccordionNav.vue';
import ChangeLogPanel from '../components/admin/change-log/ChangeLogPanel.vue';

const { getSummaryMock, listMock, getEntityTypesMock, getUsersMock } = vi.hoisted(() => ({
  getSummaryMock: vi.fn(),
  listMock: vi.fn(),
  getEntityTypesMock: vi.fn(),
  getUsersMock: vi.fn(),
}));

vi.mock('../services/ChangeLogHttpClient', () => ({
  ChangeLogHttpClient: vi.fn().mockImplementation(() => ({
    getSummary: getSummaryMock,
    list: listMock,
    getEntityTypes: getEntityTypesMock,
  })),
}));
vi.mock('../services/AdminUsersHttpClient', () => ({
  AdminUsersHttpClient: vi.fn().mockImplementation(() => ({ getUsers: getUsersMock })),
}));

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
    userId: 1, email: 't@e.com', fullName: 'T', mustChangePassword: false,
    roles: opts.role ? [opts.role] : [],
    claims: opts.role ? claimsForRole(opts.role) : [],
    isSystemAdmin: opts.isSystemAdmin ?? false,
  };
  return pinia;
}

const sampleSummary = {
  fromUtc: '2026-08-22T05:00:00Z', toUtc: '2026-08-22T20:00:00Z',
  groupBy: 'day', tzOffsetMinutes: -300,
  totals: { inserts: 2, updates: 5, deletes: 1, total: 8, distinctUsers: 2, distinctEntities: 3 },
  byUser: [{ userId: 7, displayName: 'Reyes, Ana', inserts: 1, updates: 3, deletes: 0, total: 4, lastOccurredAtUtc: '2026-08-22T19:00:00Z' }],
  byEntityType: [{ entityType: 'Patient', inserts: 1, updates: 2, deletes: 0, total: 3, lastOccurredAtUtc: '2026-08-22T19:00:00Z' }],
  byPeriod: [{ periodStart: '2026-08-22', label: '2026-08-22', inserts: 2, updates: 5, deletes: 1, total: 8 }],
  byPeriodOmitted: false,
};

const sampleList = {
  items: [{
    id: 10, occurredAtUtc: '2026-08-22T19:00:00Z', user: { userId: 7, displayName: 'Reyes, Ana' },
    entityType: 'Patient', entityId: '5', entityLabel: 'NC26-0142', action: 'Update',
    changedFields: ['Phone', 'Email'], correlationId: 'req-1',
  }],
  page: 1, pageSize: 25, totalCount: 1,
};

beforeEach(() => {
  getSummaryMock.mockReset().mockResolvedValue(structuredClone(sampleSummary));
  listMock.mockReset().mockResolvedValue(structuredClone(sampleList));
  getEntityTypesMock.mockReset().mockResolvedValue([{ entityType: 'Patient', displayName: 'Patient' }]);
  getUsersMock.mockReset().mockResolvedValue({ items: [], page: 1, pageSize: 10, totalCount: 0 });
});

describe('WP-54C nav gating', () => {
  it('SYSADMIN sees the Change Log entry', () => {
    const wrapper = mount(AdminAccordionNav, {
      props: { activeSection: 'change-log' },
      global: { plugins: [authAs({ isSystemAdmin: true })] },
    });
    expect(wrapper.find('[data-testid="nav-change-log"]').exists()).toBe(true);
  });

  it('MGR does not see the Change Log entry', () => {
    const wrapper = mount(AdminAccordionNav, {
      props: { activeSection: 'users' },
      global: { plugins: [authAs({ role: 'MGR' })] },
    });
    expect(wrapper.find('[data-testid="nav-change-log"]').exists()).toBe(false);
  });
});

describe('WP-54C ChangeLogPanel', () => {
  const mountPanel = () => mount(ChangeLogPanel, { global: { plugins: [authAs({ isSystemAdmin: true })] } });

  it('loads summary + list on mount and leads with by-user', async () => {
    const wrapper = mountPanel();
    await flushPromises();

    expect(getSummaryMock).toHaveBeenCalled();
    expect(listMock).toHaveBeenCalled();
    expect(wrapper.find('[data-testid="stat-total"]').text()).toBe('8');
    expect(wrapper.find('[data-testid="changelog-byuser-row"]').text()).toContain('Reyes, Ana');
  });

  it('clicking a by-user row filters the detail by that user', async () => {
    const wrapper = mountPanel();
    await flushPromises();
    listMock.mockClear();

    await wrapper.find('[data-testid="changelog-byuser-row"]').trigger('click');
    await flushPromises();

    expect(listMock).toHaveBeenCalled();
    expect(listMock.mock.calls.at(-1)![0].userId).toBe(7);
  });

  it('changing the period group re-queries the summary', async () => {
    const wrapper = mountPanel();
    await flushPromises();
    getSummaryMock.mockClear();

    await wrapper.find('[data-testid="groupby-month"]').trigger('click');
    await flushPromises();

    expect(getSummaryMock).toHaveBeenCalled();
    expect(getSummaryMock.mock.calls.at(-1)![0].groupBy).toBe('month');
  });

  it('expands a row to show the changed field names (no values)', async () => {
    const wrapper = mountPanel();
    await flushPromises();

    await wrapper.find('[data-testid="change-row-toggle-10"]').trigger('click');
    const diff = wrapper.find('[data-testid="change-fields-10"]');
    expect(diff.exists()).toBe(true);
    const text = wrapper.text();
    expect(text).toContain('Phone');
    expect(text).toContain('Email');
    expect(text).toContain('not recorded'); // the no-values note
  });

  it('Print / Save as PDF calls window.print', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    const wrapper = mountPanel();
    await flushPromises();

    await wrapper.find('[data-testid="changelog-print"]').trigger('click');
    await flushPromises();

    expect(printSpy).toHaveBeenCalled();
  });

  it('surfaces the error banner when a query rejects', async () => {
    getSummaryMock.mockRejectedValue(new Error('Boom'));
    const wrapper = mountPanel();
    await flushPromises();

    expect(wrapper.text()).toContain('Boom');
  });
});
