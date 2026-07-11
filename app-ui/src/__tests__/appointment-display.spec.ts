// B3 + B4 (meeting punch list 2026-07-07):
//   B3 — the Proposed › Session Details panel (ActionsPanel) must show the patient's
//        primary caretaker name/phone/email (new SessionEvent fields, contract-first).
//   B4 — the Dashboard Appointments panel rows must show the resolved Specialty Type
//        name (specialtyName was already in the DTO but never rendered).

import { describe, it, expect, vi } from 'vitest';
import { setActivePinia, createPinia, type Pinia } from 'pinia';
import { mount, flushPromises } from '@vue/test-utils';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import type { Appointment } from '../interfaces/Appointment';
import ActionsPanel from '../components/appointments/ActionsPanel.vue';
import O2Appointments from '../components/option02/O2Appointments.vue';

const { getSessionsMock } = vi.hoisted(() => ({
  getSessionsMock: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services/SessionsHttpClient', () => ({
  SessionsHttpClient: vi.fn().mockImplementation(() => ({
    getSessions: getSessionsMock,
  })),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function claimsForRole(role: string): ClaimDto[] {
  return (manifest.claims as Array<{ claim: string; grants: string[] }>)
    .filter((c) => c.grants.includes(role))
    .map((c) => ({ type: 'Permission', value: c.claim }));
}

function authAs(role: string): Pinia {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useAuthStore();
  store.user = {
    userId: 1,
    email: 'test@example.com',
    fullName: 'Test User',
    mustChangePassword: false,
    roles: [role],
    claims: claimsForRole(role),
    isSystemAdmin: false,
  };
  return pinia;
}

function appointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    sessionId: 1,
    sessionDate: '2026-07-11',
    sessionTime: '09:00:00',
    patient: 'Doe, John',
    therapist: 'Smith, Jane',
    therapyTypes: 'NM',
    amount: 100,
    discount: 0,
    amountPaid: 0,
    amountDue: 100,
    isPastDue: false,
    isPaidOff: false,
    notes: '',
    patientId: 1,
    therapistId: 1,
    time: '09:00',
    appointmentStatusId: 1,
    statusName: 'Proposed',
    isConfirmed: false,
    siteId: 1,
    siteName: 'Main',
    specialtyTypeId: 14,
    specialtyAbbreviation: 'NM',
    specialtyName: 'Neuro Motor',
    isDiscovery: false,
    caretakerName: 'Doe, Mary',
    caretakerPhone: '555-0001',
    caretakerEmail: 'mary@example.com',
    ...overrides,
  };
}

describe('ActionsPanel — caretaker contact info (B3)', () => {
  function mountPanel(appt: Appointment) {
    const pinia = authAs('MGR');
    return mount(ActionsPanel, {
      props: { visible: true, appointment: appt },
      global: { plugins: [pinia], stubs: { teleport: true } },
    });
  }

  it('shows the caretaker name, phone, and email in Appointment Info', () => {
    const wrapper = mountPanel(appointment());
    expect(wrapper.text()).toContain('Caretaker');
    expect(wrapper.text()).toContain('Doe, Mary');
    expect(wrapper.text()).toContain('555-0001');
    expect(wrapper.text()).toContain('mary@example.com');
  });

  it('shows a dash when the patient has no caretaker', () => {
    const wrapper = mountPanel(
      appointment({ caretakerName: null, caretakerPhone: null, caretakerEmail: null })
    );
    expect(wrapper.text()).toContain('Caretaker');
    expect(wrapper.text()).not.toContain('mary@example.com');
  });
});

describe('O2Appointments — specialty type on rows (B4)', () => {
  it('renders the resolved specialty name on the appointment row', async () => {
    getSessionsMock.mockResolvedValueOnce([appointment()]);
    const pinia = authAs('MGR');
    const wrapper = mount(O2Appointments, {
      props: { selectedDate: '2026-07-11' },
      global: { plugins: [pinia] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Neuro Motor');
  });

  it('falls back to the raw therapy-type code when no specialty is resolved', async () => {
    getSessionsMock.mockResolvedValueOnce([
      appointment({ specialtyName: null, specialtyAbbreviation: null, specialtyTypeId: null, therapyTypes: 'XY' }),
    ]);
    const pinia = authAs('MGR');
    const wrapper = mount(O2Appointments, {
      props: { selectedDate: '2026-07-11' },
      global: { plugins: [pinia] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('XY');
  });
});
