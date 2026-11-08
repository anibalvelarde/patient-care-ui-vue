// WP-58 (F-18) — TherapistReassignModal must not echo the session's loaded amountPaid / isPaidOff
// back to PUT /api/sessions/{id}. A payment recorded while the modal was open used to be erased
// by the stale value. (No spec existed for this modal before WP-58.)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import type { Appointment } from '../interfaces/Appointment';
import TherapistReassignModal from '../components/appointments/TherapistReassignModal.vue';

const { therapistsClientMocks, sessionsClientMocks } = vi.hoisted(() => ({
  therapistsClientMocks: { getTherapists: vi.fn() },
  sessionsClientMocks: { updateSession: vi.fn() },
}));

vi.mock('../services/TherapistsHttpClient', () => ({
  TherapistsHttpClient: vi.fn().mockImplementation(() => ({ ...therapistsClientMocks })),
}));

vi.mock('../services/SessionsHttpClient', () => ({
  SessionsHttpClient: vi.fn().mockImplementation(() => ({ ...sessionsClientMocks })),
}));

function session(overrides: Partial<Appointment> = {}): Appointment {
  return {
    sessionId: 12351, sessionDate: '2026-11-08', sessionTime: '10:00:00',
    patient: 'PATIENT, TEST', therapist: 'THERAPIST, ONE', therapistId: 3,
    therapyTypes: 'TL', specialtyTypeId: 6, specialtyAbbreviation: 'TL',
    amount: 50, discount: 10, amountPaid: 0, amountDue: 40, isPaidOff: false,
    appointmentStatusId: 2, siteId: 1, notes: '',
    ...overrides,
  } as Appointment;
}

describe('TherapistReassignModal — PUT payload (WP-58 F-18)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    therapistsClientMocks.getTherapists.mockResolvedValue([
      { therapistId: 3, therapistName: 'THERAPIST, ONE', specialties: [{ specialtyId: 6 }] },
      { therapistId: 8, therapistName: 'THERAPIST, TWO', specialties: [{ specialtyId: 6 }] },
    ]);
    sessionsClientMocks.updateSession.mockResolvedValue(undefined);
  });

  it('sends the new therapist but never amountPaid / isPaidOff', async () => {
    const wrapper = mount(TherapistReassignModal, {
      props: { visible: false, session: session() },
      global: { stubs: { teleport: true } },
    });
    await wrapper.setProps({ visible: true });
    await flushPromises();

    await wrapper.find('select').setValue(8);
    const reassign = wrapper.findAll('button').find((b) => b.text() === 'Reassign');
    await reassign!.trigger('click');
    await flushPromises();

    expect(sessionsClientMocks.updateSession).toHaveBeenCalledTimes(1);
    const [id, payload] = sessionsClientMocks.updateSession.mock.calls[0] as [number, Record<string, unknown>];
    expect(id).toBe(12351);
    expect(payload.therapistId).toBe(8);
    expect(payload).not.toHaveProperty('amountPaid');
    expect(payload).not.toHaveProperty('isPaidOff');
    expect(payload).not.toHaveProperty('duration');
  });
});
