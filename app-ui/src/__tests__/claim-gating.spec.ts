// WP-17C — claim-gating behavior.
//
// Two layers:
//  1. Store matrix — for each seeded role (claims taken straight from the manifest grants) assert the
//     `hasClaim` predicate that every UI gate calls returns the matrix-correct answer for the sensitive
//     cells (Delinquent, ProviderAmount, Statements, Admin, Payments adjust, plan content edit, …).
//  2. Component show/hide — mount real components with a role's claim set and assert the right controls
//     render (Patients Delinquent tab) / nav items appear (Statements item).

import { describe, it, expect } from 'vitest';
import { setActivePinia, createPinia, type Pinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import manifest from '../generated/access-control-matrix.json';
import { Permissions } from '../generated/permissions';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import PatientList from '../components/patients/PatientList.vue';
import O2Sidebar from '../components/option02/O2Sidebar.vue';

type Role = 'MGR' | 'AM' | 'FD';

function claimsForRole(role: Role): ClaimDto[] {
  return (manifest.claims as Array<{ claim: string; grants: string[] }>)
    .filter((c) => c.grants.includes(role))
    .map((c) => ({ type: 'Permission', value: c.claim }));
}

/** Install a fresh Pinia and seed the auth store with the given identity. Returns the pinia to mount. */
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

const has = (p: string) => useAuthStore().hasClaim('Permission', p);

describe('store hasClaim matrix (the predicate every gate calls)', () => {
  it('FrontDesk: operational access, no delinquency / economics / statements / admin / adjust / plan-edit', () => {
    authAs({ role: 'FD' });
    // granted
    expect(has(Permissions.PatientsView)).toBe(true);
    expect(has(Permissions.PatientsEdit)).toBe(true);
    expect(has(Permissions.PaymentsRecord)).toBe(true);
    expect(has(Permissions.TreatmentPlansBook)).toBe(true);
    expect(has(Permissions.AppointmentsBook)).toBe(true);
    // denied
    expect(has(Permissions.PatientsDelinquentView)).toBe(false);
    expect(has(Permissions.TherapistsDelinquentView)).toBe(false);
    expect(has(Permissions.AppointmentsProviderAmount)).toBe(false);
    expect(has(Permissions.DashboardProviderAmount)).toBe(false);
    expect(has(Permissions.StatementsView)).toBe(false);
    expect(has(Permissions.StatementsTherapistView)).toBe(false);
    expect(has(Permissions.AppointmentsReassign)).toBe(false);
    expect(has(Permissions.PaymentsAdjust)).toBe(false);
    expect(has(Permissions.TreatmentPlansEdit)).toBe(false);
    expect(has(Permissions.PatientsStartDiscovery)).toBe(false);
    expect(has(Permissions.AdminView)).toBe(false);
  });

  it('AssistantManager: economics + delinquency + adjust + plan-edit, but no Admin, no specialties, no refund', () => {
    authAs({ role: 'AM' });
    expect(has(Permissions.PatientsDelinquentView)).toBe(true);
    expect(has(Permissions.AppointmentsProviderAmount)).toBe(true);
    expect(has(Permissions.StatementsView)).toBe(true);
    expect(has(Permissions.PaymentsAdjust)).toBe(true);
    expect(has(Permissions.TreatmentPlansEdit)).toBe(true);
    expect(has(Permissions.AppointmentsReassign)).toBe(true);
    // denied
    expect(has(Permissions.AdminView)).toBe(false);
    expect(has(Permissions.TherapistsManageSpecialties)).toBe(false);
    expect(has(Permissions.PaymentsRefund)).toBe(false);
  });

  it('Manager: full operator incl. Admin (read), specialties, refund', () => {
    authAs({ role: 'MGR' });
    expect(has(Permissions.AdminView)).toBe(true);
    expect(has(Permissions.TherapistsManageSpecialties)).toBe(true);
    expect(has(Permissions.PaymentsRefund)).toBe(true);
    expect(has(Permissions.AppointmentsProviderAmount)).toBe(true);
    // MGR has Admin view but not the SYSADMIN-only Manage claims
    expect(has(Permissions.AdminSitesManage)).toBe(false);
    expect(has(Permissions.AdminLookupsRoleTypeManage)).toBe(false);
  });

  it('SystemAdmin wildcard: satisfies every claim, including SYSADMIN-only Manage', () => {
    authAs({ isSystemAdmin: true });
    expect(has(Permissions.AdminSitesManage)).toBe(true);
    expect(has(Permissions.PaymentsRefund)).toBe(true);
    expect(has(Permissions.SystemDiagnostics)).toBe(true);
  });
});

describe('PatientList — Delinquent tab gating', () => {
  function mountAs(role: Role) {
    const pinia = authAs({ role });
    return mount(PatientList, {
      props: { patients: [], pastDuePatients: [], initialTab: 'all' },
      global: { plugins: [pinia], stubs: { 'font-awesome-icon': true } },
    });
  }
  const tabLabels = (w: ReturnType<typeof mountAs>) =>
    w.findAll('button').map((b) => b.text());

  it('hides the Delinquent tab for FrontDesk', () => {
    const labels = tabLabels(mountAs('FD'));
    expect(labels).toContain('All');
    expect(labels).not.toContain('Delinquent');
  });

  it('shows the Delinquent tab for AssistantManager', () => {
    expect(tabLabels(mountAs('AM'))).toContain('Delinquent');
  });
});

describe('O2Sidebar — nav visibility', () => {
  async function mountAs(role: Role) {
    const pinia = authAs({ role });
    const router = createRouter({
      history: createMemoryHistory(),
      // Catch-all so the sidebar's router-links (/patients, /statements, …) all resolve in-test.
      routes: [{ path: '/:rest(.*)*', component: { template: '<div/>' } }],
    });
    router.push('/');
    await router.isReady();
    return mount(O2Sidebar, {
      global: { plugins: [pinia, router], stubs: { 'font-awesome-icon': true } },
    });
  }

  it('hides the Statements item for FrontDesk (no Statements.View)', async () => {
    const w = await mountAs('FD');
    expect(w.text()).not.toContain('Statements');
    expect(w.text()).toContain('Patients');
  });

  it('shows the Statements item for AssistantManager', async () => {
    const w = await mountAs('AM');
    expect(w.text()).toContain('Statements');
  });
});
