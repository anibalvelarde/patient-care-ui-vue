// WP-59 (E2E finding F-2) — double-booking. The API now answers a clashing booking with a
// 409 ProblemDetails whose `detail` names the clashing session. The UI must:
//   1. keep the HTTP status on the thrown error (ApiError) instead of dropping it;
//   2. show the conflict in the booking modal with a clear heading, keep the form filled in and
//      the modal open, so the front desk can change the time or therapist and try again;
//   3. show it in the reassign modal too.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia, type Pinia } from 'pinia';
import { mount, flushPromises } from '@vue/test-utils';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import type { Appointment } from '../interfaces/Appointment';
import { HttpClientBase } from '../services/HttpClientBase';
import { ApiError } from '../services/ApiError';
import BookingFormModal from '../components/appointments/BookingFormModal.vue';
import TherapistReassignModal from '../components/appointments/TherapistReassignModal.vue';

const THERAPIST_DETAIL =
  'Therapist Ana Synthetic already has a session on 2026-11-09 from 10:00 to 10:30 (session #12359). Choose another time or therapist.';
const PATIENT_DETAIL =
  'This patient already has a session on 2026-11-09 from 10:00 to 11:00 with Ben Synthetic (session #40).';

const { createSessionMock, updateSessionMock, getTherapistsMock } = vi.hoisted(() => ({
  createSessionMock: vi.fn(),
  updateSessionMock: vi.fn(),
  getTherapistsMock: vi.fn(),
}));

vi.mock('../services/SessionsHttpClient', () => ({
  SessionsHttpClient: vi.fn().mockImplementation(() => ({
    createSession: createSessionMock,
    updateSession: updateSessionMock,
  })),
}));
vi.mock('../services/TherapistsHttpClient', () => ({
  TherapistsHttpClient: vi.fn().mockImplementation(() => ({ getTherapists: getTherapistsMock })),
}));
vi.mock('../services/PatientsHttpClient', () => ({
  PatientsHttpClient: vi.fn().mockImplementation(() => ({
    getPatient: vi.fn().mockResolvedValue({ patientId: 1, patientName: 'Synthetic, Pat', hasSenadisDiscount: false, hasCompletedDiscovery: true }),
    getPatientCaretakers: vi.fn().mockResolvedValue([{ caretakerId: 1, caretakerName: 'Care, Cara', isPrimaryCaretaker: true }]),
    lookupPatients: vi.fn().mockResolvedValue([]),
  })),
}));
vi.mock('../services/LookupHttpClient', () => ({
  LookupHttpClient: vi.fn().mockImplementation(() => ({
    getAll: vi.fn().mockResolvedValue([{
      id: 5, abbreviation: 'TC', name: 'Conduct Therapy', description: null, sortOrder: 1,
      defaultAmount: 40, offeredOnSite: false, createdTimestamp: '', lastUpdatedTimestamp: '',
      durationPrices: [{ durationMinutes: 60, amount: 45, effectiveFrom: '2026-01-01' }],
    }]),
  })),
}));
vi.mock('../services/SitesHttpClient', () => ({
  SitesHttpClient: vi.fn().mockImplementation(() => ({ getSites: vi.fn().mockResolvedValue([]) })),
}));
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));

function authAs(role: string): Pinia {
  const pinia = createPinia();
  setActivePinia(pinia);
  const claims: ClaimDto[] = (manifest.claims as Array<{ claim: string; grants: string[] }>)
    .filter((c) => c.grants.includes(role))
    .map((c) => ({ type: 'Permission', value: c.claim }));
  useAuthStore().user = {
    userId: 1, email: 'test@example.com', fullName: 'Test User', mustChangePassword: false,
    roles: [role], claims, isSystemAdmin: false,
  };
  return pinia;
}

beforeEach(() => {
  vi.clearAllMocks();
  getTherapistsMock.mockResolvedValue([
    { therapistId: 3, id: 3, therapistName: 'THERAPIST, ONE', feePerSession: 25, feePctPerSession: 0, specialties: [{ specialtyId: 5 }, { specialtyId: 6 }] },
    { therapistId: 8, id: 8, therapistName: 'THERAPIST, TWO', feePerSession: 25, feePctPerSession: 0, specialties: [{ specialtyId: 5 }, { specialtyId: 6 }] },
  ]);
});

// ── 1. HttpClientBase keeps the status ───────────────────────────────────────

describe('HttpClientBase — WP-59 typed ApiError', () => {
  class TestClient extends HttpClientBase {
    postTest(url: string): Promise<unknown> {
      return this.post(url, {});
    }
  }
  const problem = (status: number, detail: string) => ({
    ok: false, status,
    text: async () => JSON.stringify({ title: 'Conflict', status, detail }),
  }) as unknown as Response;

  afterEach(() => vi.unstubAllGlobals());

  it('a 409 ProblemDetails rejects with an ApiError carrying status 409 and the detail as message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(problem(409, THERAPIST_DETAIL)));

    const err = await new TestClient().postTest('/api/sessions').catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err).toBeInstanceOf(Error); // existing `e instanceof Error ? e.message` callers keep working
    expect((err as ApiError).status).toBe(409);
    expect((err as ApiError).message).toBe(THERAPIST_DETAIL);
  });

  it('a 400 keeps its status too', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(problem(400, 'bad')));

    const err = await new TestClient().postTest('/api/sessions').catch((e: unknown) => e);

    expect((err as ApiError).status).toBe(400);
  });
});

// ── 2. Booking modal ─────────────────────────────────────────────────────────

type BookingVm = {
  form: { patientId: number; therapistId: number; specialtyTypeId: number; duration: number; sessionDate: string; sessionTime: string };
  handleSubmit: () => Promise<void>;
};

describe('BookingFormModal — WP-59 double-booking 409', () => {
  it.each([THERAPIST_DETAIL, PATIENT_DETAIL])('shows the conflict, keeps the form and stays open: %s', async (detail) => {
    createSessionMock.mockRejectedValue(new ApiError(detail, 409));
    const wrapper = mount(BookingFormModal, {
      props: { visible: false },
      global: { plugins: [authAs('MGR')], stubs: { teleport: true } },
    });
    await wrapper.setProps({ visible: true });
    await flushPromises();
    const vm = wrapper.vm as unknown as BookingVm;
    Object.assign(vm.form, { patientId: 1, therapistId: 3, specialtyTypeId: 5, duration: 60, sessionDate: '2026-11-09', sessionTime: '10:00' });
    await flushPromises();

    await vm.handleSubmit();
    await flushPromises();

    const banner = wrapper.find('[data-testid="booking-conflict"]');
    expect(banner.exists()).toBe(true);
    expect(banner.text()).toContain('This time is already taken');
    expect(banner.text()).toContain(detail);
    expect(wrapper.emitted('close')).toBeFalsy();
    expect(wrapper.emitted('saved')).toBeFalsy();
    expect(vm.form.sessionTime).toBe('10:00');
    expect(vm.form.therapistId).toBe(3);
  });

  it('a non-409 error keeps the plain error banner (no conflict heading)', async () => {
    createSessionMock.mockRejectedValue(new ApiError('A caretaker must be linked to this patient before booking.', 400));
    const wrapper = mount(BookingFormModal, {
      props: { visible: false },
      global: { plugins: [authAs('MGR')], stubs: { teleport: true } },
    });
    await wrapper.setProps({ visible: true });
    await flushPromises();

    await (wrapper.vm as unknown as BookingVm).handleSubmit();
    await flushPromises();

    expect(wrapper.find('[data-testid="booking-conflict"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('A caretaker must be linked');
  });
});

// ── 3. Reassign modal ────────────────────────────────────────────────────────

function session(overrides: Partial<Appointment> = {}): Appointment {
  return {
    sessionId: 12360, sessionDate: '2026-11-09', sessionTime: '10:00:00',
    patient: 'SYNTHETIC, PAT', therapist: 'THERAPIST, TWO', therapistId: 8,
    therapyTypes: 'TL', specialtyTypeId: 6, specialtyAbbreviation: 'TL',
    amount: 50, discount: 0, amountDue: 50, appointmentStatusId: 2, siteId: 1, notes: '',
    ...overrides,
  } as Appointment;
}

describe('TherapistReassignModal — WP-59 double-booking 409', () => {
  it('shows the conflict and stays open', async () => {
    updateSessionMock.mockRejectedValue(new ApiError(THERAPIST_DETAIL, 409));
    const wrapper = mount(TherapistReassignModal, {
      props: { visible: false, session: session() },
      global: { stubs: { teleport: true } },
    });
    await wrapper.setProps({ visible: true });
    await flushPromises();

    await wrapper.find('select').setValue(3);
    await wrapper.findAll('button').find((b) => b.text() === 'Reassign')!.trigger('click');
    await flushPromises();

    const err = wrapper.find('[data-testid="reassign-error"]');
    expect(err.exists()).toBe(true);
    expect(err.text()).toContain('This time is already taken');
    expect(err.text()).toContain(THERAPIST_DETAIL);
    expect(wrapper.emitted('close')).toBeFalsy();
  });
});
