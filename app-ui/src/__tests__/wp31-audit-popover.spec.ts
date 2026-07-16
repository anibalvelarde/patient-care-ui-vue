// WP-31 (U1) — AuditPopover: open/close behavior, content, absent-audit tolerance, and that it
// shows for a FrontDesk user (no claim gate — anyone who sees the row sees its history).

import { describe, it, expect, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import type { AuditInfo } from '../interfaces/Audit';
import type { Patient } from '../interfaces/Patient';
import AuditPopover from '../components/shared/AuditPopover.vue';
import PatientTable from '../components/patients/PatientTable.vue';

function audit(overrides: Partial<AuditInfo> = {}): AuditInfo {
  return {
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-06-01T14:30:00Z',
    updatedBy: 'Doe, John',
    ...overrides,
  };
}

const stubs = { teleport: true };

describe('AuditPopover', () => {
  it('renders nothing when there is no audit block (older API)', () => {
    const wrapper = mount(AuditPopover, { props: { audit: null }, global: { stubs } });
    expect(wrapper.find('[data-testid="audit-info-button"]').exists()).toBe(false);
  });

  it('shows the ⓘ trigger when audit is present, popover starts closed', () => {
    const wrapper = mount(AuditPopover, { props: { audit: audit() }, global: { stubs } });
    expect(wrapper.find('[data-testid="audit-info-button"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="audit-info-popover"]').exists()).toBe(false);
  });

  it('opens on click and shows created / updated / updated-by', async () => {
    const wrapper = mount(AuditPopover, { props: { audit: audit() }, global: { stubs } });
    await wrapper.find('[data-testid="audit-info-button"]').trigger('click');

    expect(wrapper.find('[data-testid="audit-info-popover"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="audit-updated-by"]').text()).toBe('Doe, John');
    expect(wrapper.find('[data-testid="audit-created"]').text()).toContain('2025');
    expect(wrapper.find('[data-testid="audit-updated"]').text()).toContain('2025');
  });

  it('toggles closed on a second click', async () => {
    const wrapper = mount(AuditPopover, { props: { audit: audit() }, global: { stubs } });
    const btn = wrapper.find('[data-testid="audit-info-button"]');
    await btn.trigger('click');
    expect(wrapper.find('[data-testid="audit-info-popover"]').exists()).toBe(true);
    await btn.trigger('click');
    expect(wrapper.find('[data-testid="audit-info-popover"]').exists()).toBe(false);
  });

  it('closes on Escape', async () => {
    const wrapper = mount(AuditPopover, { props: { audit: audit() }, global: { stubs } });
    await wrapper.find('[data-testid="audit-info-button"]').trigger('click');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await flushPromises();
    expect(wrapper.find('[data-testid="audit-info-popover"]').exists()).toBe(false);
  });

  it('closes on an outside pointer press', async () => {
    const wrapper = mount(AuditPopover, { props: { audit: audit() }, global: { stubs } });
    await wrapper.find('[data-testid="audit-info-button"]').trigger('click');
    document.dispatchEvent(new Event('pointerdown')); // target outside the root
    await flushPromises();
    expect(wrapper.find('[data-testid="audit-info-popover"]').exists()).toBe(false);
  });

  it('shows "System" as updated-by verbatim', async () => {
    const wrapper = mount(AuditPopover, { props: { audit: audit({ updatedBy: 'System' }) }, global: { stubs } });
    await wrapper.find('[data-testid="audit-info-button"]').trigger('click');
    expect(wrapper.find('[data-testid="audit-updated-by"]').text()).toBe('System');
  });
});

// Integration: the popover shows in the Patients table for a FrontDesk user (no claim gate).
function claimsForRole(role: string): ClaimDto[] {
  return (manifest.claims as Array<{ claim: string; grants: string[] }>)
    .filter((c) => c.grants.includes(role))
    .map((c) => ({ type: 'Permission', value: c.claim }));
}

function authAs(role: string) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useAuthStore();
  store.user = {
    userId: 1, email: 't@e.com', fullName: 'Test', mustChangePassword: false,
    roles: [role], claims: claimsForRole(role), isSystemAdmin: false,
  };
  return pinia;
}

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    patientId: 1, userId: 1, patientName: 'Roe, Jane', medicalRecordNumber: 'L26-0001',
    cedula: null, dateOfBirth: '2000-01-01', email: null, phoneNumber: null, gender: null,
    isActive: true, hasCompletedDiscovery: null, createdTimestamp: '2025-01-01T00:00:00Z',
    audit: audit(), caretakers: [], ...overrides,
  } as Patient;
}

describe('PatientTable audit popover', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('renders the ⓘ trigger on rows for a FrontDesk user', () => {
    const wrapper = mount(PatientTable, {
      props: { patients: [patient()] },
      global: { plugins: [authAs('FD')], stubs },
    });
    // desktop + mobile both render a trigger for the row
    expect(wrapper.findAll('[data-testid="audit-info-button"]').length).toBeGreaterThan(0);
  });

  it('omits the ⓘ trigger when a row has no audit block', () => {
    const wrapper = mount(PatientTable, {
      props: { patients: [patient({ audit: undefined })] },
      global: { plugins: [authAs('FD')], stubs },
    });
    expect(wrapper.find('[data-testid="audit-info-button"]').exists()).toBe(false);
  });
});
