// WP-22C (F2) — Admin › Merge Patients (SYSADMIN-only).
//
// Three layers:
//  1. Store matrix — Patients.Merge has an EMPTY grants row: hasClaim must be false for every
//     granular operator role and true only via the SYSADMIN wildcard.
//  2. Nav gating — the Data Maintenance group renders only when the principal holds
//     Patients.Merge (i.e. SYSADMIN).
//  3. Panel behavior — preview gates execute, blockers disable it, type-to-confirm must match
//     the duplicate's MRN, and a successful merge shows the result card.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia, type Pinia } from 'pinia';
import manifest from '../generated/access-control-matrix.json';
import { Permissions } from '../generated/permissions';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import AdminAccordionNav from '../components/admin/AdminAccordionNav.vue';
import PatientMergePanel from '../components/admin/PatientMergePanel.vue';
import type { LookupOption } from '../components/shared/LookupSelect.vue';
import type { PatientMergePreview, PatientMergeResult } from '../interfaces/PatientMerge';

const { lookupPatientsMock, previewMergeMock, executeMergeMock } = vi.hoisted(() => ({
  lookupPatientsMock: vi.fn(),
  previewMergeMock: vi.fn(),
  executeMergeMock: vi.fn(),
}));

vi.mock('../services/PatientsHttpClient', () => ({
  PatientsHttpClient: vi.fn().mockImplementation(() => ({
    lookupPatients: lookupPatientsMock,
    previewMerge: previewMergeMock,
    executeMerge: executeMergeMock,
  })),
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

// WP-30: the pickers hold slim lookup rows, not full Patient profiles.
const survivor: LookupOption = { id: 1, name: 'Perez, Juan', detail: 'MRN L24-0312' };
const duplicate: LookupOption = { id: 2, name: 'Perez, Jaun', detail: 'MRN L24-0313' };

function makePreview(overrides: Partial<PatientMergePreview> = {}): PatientMergePreview {
  return {
    survivor: {
      patientId: 1, userId: 10, patientName: 'Perez, Juan', medicalRecordNumber: 'L24-0312',
      cedula: null, dateOfBirth: '2018-05-04T00:00:00', gender: 'Male', isActive: true,
      sessionCount: 12, planCount: 1, caretakerCount: 1,
    },
    eliminated: {
      patientId: 2, userId: 20, patientName: 'Perez, Jaun', medicalRecordNumber: 'L24-0313',
      cedula: null, dateOfBirth: null, gender: null, isActive: true,
      sessionCount: 2, planCount: 0, caretakerCount: 1,
    },
    counts: {
      sessionsToRemap: 2, plansToRemap: 0, caretakerLinksToRemap: 0,
      caretakerLinksToDedupe: 0, syntheticCaretakersToDelete: 1,
    },
    caretakers: [
      { caretakerId: 55, caretakerName: 'Perez-SH (LEGACY), Jaun', isSynthetic: true, disposition: 'retire-synthetic', primaryFlagDropped: false },
    ],
    fieldFills: [],
    warnings: [],
    blockers: [],
    ...overrides,
  };
}

function makeResult(): PatientMergeResult {
  return {
    survivorPatientId: 1, eliminatedPatientId: 2, mergeLogId: 42,
    counts: { sessionsRemapped: 2, plansRemapped: 0, caretakerLinksRemapped: 0, caretakerLinksDeduped: 0, syntheticCaretakersDeleted: 1 },
    fieldsFilled: ['DateOfBirth'], mergedAtUtc: '2026-07-15T14:30:00Z',
  };
}

async function mountPanel(): Promise<ReturnType<typeof mount>> {
  const pinia = authAs({ isSystemAdmin: true });
  const wrapper = mount(PatientMergePanel, { global: { plugins: [pinia] } });
  await flushPromises();
  return wrapper;
}

/** Drive the panel to the previewed state with both patients selected. */
async function mountPreviewedPanel(preview = makePreview()) {
  previewMergeMock.mockResolvedValue(preview);
  const wrapper = await mountPanel();
  const vm = wrapper.vm as unknown as { survivor: LookupOption | null; eliminated: LookupOption | null };
  vm.survivor = survivor;
  vm.eliminated = duplicate;
  await wrapper.vm.$nextTick();
  await wrapper.find('button.bg-violet-600').trigger('click');
  await flushPromises();
  return wrapper;
}

beforeEach(() => {
  lookupPatientsMock.mockReset().mockResolvedValue([
    { patientId: 1, patientName: 'Perez, Juan', medicalRecordNumber: 'L24-0312' },
    { patientId: 2, patientName: 'Perez, Jaun', medicalRecordNumber: 'L24-0313' },
  ]);
  previewMergeMock.mockReset();
  executeMergeMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('store hasClaim matrix — Patients.Merge is wildcard-only', () => {
  it.each(['MGR', 'AM', 'FD', 'OWN', 'ACCT'] as Role[])('%s does NOT hold Patients.Merge', (role) => {
    authAs({ role });
    expect(useAuthStore().hasClaim('Permission', Permissions.PatientsMerge)).toBe(false);
  });

  it('SYSADMIN satisfies Patients.Merge via the wildcard', () => {
    authAs({ isSystemAdmin: true });
    expect(useAuthStore().hasClaim('Permission', Permissions.PatientsMerge)).toBe(true);
  });

  it('the manifest itself carries an empty grants row for Patients.Merge', () => {
    const row = (manifest.claims as Array<{ claim: string; grants: string[] }>)
      .find((c) => c.claim === 'Patients.Merge');
    expect(row).toBeDefined();
    expect(row!.grants).toEqual([]);
  });
});

describe('AdminAccordionNav — Data Maintenance gating', () => {
  function mountNav(opts: { role?: Role; isSystemAdmin?: boolean }) {
    const pinia = authAs(opts);
    return mount(AdminAccordionNav, {
      props: { activeSection: 'sites' },
      global: { plugins: [pinia] },
    });
  }

  it('hides the group for MGR (holds Admin.View but not Patients.Merge)', () => {
    const w = mountNav({ role: 'MGR' });
    expect(w.find('[data-testid="nav-group-data-maintenance"]').exists()).toBe(false);
    expect(w.find('[data-testid="nav-merge-patients"]').exists()).toBe(false);
  });

  it('shows the group for SYSADMIN and emits select on click', async () => {
    const w = mountNav({ isSystemAdmin: true });
    expect(w.find('[data-testid="nav-group-data-maintenance"]').exists()).toBe(true);
    await w.find('[data-testid="nav-merge-patients"]').trigger('click');
    expect(w.emitted('select')).toEqual([['merge-patients']]);
  });
});

describe('PatientMergePanel — stepper behavior', () => {
  // WP-30: no census load on mount — the pickers are lookup typeaheads (server cap 20).
  it('picks a survivor through the lookup typeahead (debounced, excludes the other side)', async () => {
    vi.useFakeTimers();
    const wrapper = await mountPanel();
    expect(lookupPatientsMock).not.toHaveBeenCalled(); // nothing loads until the user types

    const input = wrapper.find('[data-testid="merge-survivor-input"]');
    await input.trigger('focus');
    await input.setValue('per');
    expect(lookupPatientsMock).not.toHaveBeenCalled(); // still inside the debounce window
    vi.advanceTimersByTime(300);
    await flushPromises();
    expect(lookupPatientsMock).toHaveBeenCalledWith('per');

    const options = wrapper.findAll('[data-testid="merge-survivor-option"]');
    expect(options).toHaveLength(2);
    await options[0].trigger('mousedown');
    expect(wrapper.find('[data-testid="merge-survivor-selected"]').text()).toContain('Perez, Juan');

    // The duplicate picker hides the already-picked survivor (excludeIds).
    const dupInput = wrapper.find('[data-testid="merge-eliminated-input"]');
    await dupInput.trigger('focus');
    await dupInput.setValue('per');
    vi.advanceTimersByTime(300);
    await flushPromises();
    const dupOptions = wrapper.findAll('[data-testid="merge-eliminated-option"]');
    expect(dupOptions).toHaveLength(1);
    expect(dupOptions[0].text()).toContain('Perez, Jaun');
  });

  it('preview button disabled until both sides are picked', async () => {
    const wrapper = await mountPanel();
    const previewBtn = wrapper.find('button.bg-violet-600');
    expect(previewBtn.attributes('disabled')).toBeDefined();
  });

  it('preview renders counts and dispositions; execute requires the matching MRN', async () => {
    const wrapper = await mountPreviewedPanel();

    expect(previewMergeMock).toHaveBeenCalledWith({ survivorPatientId: 1, eliminatedPatientId: 2 });
    expect(wrapper.find('[data-testid="merge-preview"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('placeholder retired');

    const execBtn = wrapper.find('[data-testid="merge-execute-button"]');
    expect(execBtn.attributes('disabled')).toBeDefined();

    // Wrong text keeps it disabled; the duplicate's MRN enables it.
    await wrapper.find('[data-testid="merge-confirm-input"]').setValue('nope');
    expect(wrapper.find('[data-testid="merge-execute-button"]').attributes('disabled')).toBeDefined();
    await wrapper.find('[data-testid="merge-confirm-input"]').setValue('L24-0313');
    expect(wrapper.find('[data-testid="merge-execute-button"]').attributes('disabled')).toBeUndefined();
  });

  it('blockers hide the confirm step entirely', async () => {
    const wrapper = await mountPreviewedPanel(makePreview({
      blockers: ['Eliminated patient\'s user 20 holds non-Patient roles; resolve manually before merging.'],
    }));

    expect(wrapper.find('[data-testid="merge-blockers"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="merge-execute-button"]').exists()).toBe(false);
  });

  it('successful merge shows the result card', async () => {
    executeMergeMock.mockResolvedValue(makeResult());
    const wrapper = await mountPreviewedPanel();

    await wrapper.find('[data-testid="merge-confirm-input"]').setValue('L24-0313');
    await wrapper.find('[data-testid="merge-execute-button"]').trigger('click');
    await flushPromises();

    expect(executeMergeMock).toHaveBeenCalledWith({ survivorPatientId: 1, eliminatedPatientId: 2 });
    expect(wrapper.text()).toContain('Merge completed — log #42');
    expect(wrapper.text()).toContain('2 session(s) moved');
  });

  it('a failed merge surfaces the error and stays on the preview', async () => {
    executeMergeMock.mockRejectedValue(new Error('Conflict: resolve manually'));
    const wrapper = await mountPreviewedPanel();

    await wrapper.find('[data-testid="merge-confirm-input"]').setValue('L24-0313');
    await wrapper.find('[data-testid="merge-execute-button"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Conflict: resolve manually');
    expect(wrapper.find('[data-testid="merge-preview"]').exists()).toBe(true);
  });
});
