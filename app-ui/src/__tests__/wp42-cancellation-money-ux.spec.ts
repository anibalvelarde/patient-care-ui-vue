// WP-42C — cancellation/no-show money UX:
//   1. SiteFormModal gains noShowFeePct — editable for SYSADMIN only; everyone else sees it
//      read-only and the PUT ECHOES the stored value unchanged (passes the API field-gate).
//      Field absent on the wire (older API) → fee UI hidden, field never sent.
//   2. Cancel flow shows a pre-confirm "money will be zeroed" note (only when amount > 0).
//   3. No Show gets a confirm step stating the fee: "A no-show fee of {pct}% of ${amount}
//      (= ${fee}) will be charged" — display-only from the session's site; API authoritative.
//   4. WP-42B guard/lock 400s (ProblemDetails `detail`) surface verbatim through
//      HttpClientBase.extractErrorMessage into the panel's error box.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia, type Pinia } from 'pinia';
import { mount, flushPromises } from '@vue/test-utils';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import type { Site } from '../interfaces/Site';
import type { Appointment } from '../interfaces/Appointment';
import { HttpClientBase } from '../services/HttpClientBase';
import SiteFormModal from '../components/sites/SiteFormModal.vue';
import ActionsPanel from '../components/appointments/ActionsPanel.vue';

// The two EXACT WP-42B ProblemDetails detail strings (match on `detail` — see
// _contracts/sessions-api.md "WP-42 money-at-transition semantics").
const GUARD_PAYMENTS_DETAIL =
  'Payments are recorded against this session; money-moved cancellations are refund territory.';
const GUARD_COVERED_DETAIL =
  'This session is covered by a service payment — reverse the covering payment first.';

// ── hoisted client mocks ─────────────────────────────────────────────────────

const { sitesClientMocks, sessionsClientMocks, patientsClientMocks } = vi.hoisted(() => ({
  sitesClientMocks: {
    getSites: vi.fn(),
    getSite: vi.fn(),
    createSite: vi.fn(),
    updateSite: vi.fn(),
  },
  sessionsClientMocks: {
    updateSession: vi.fn(),
    confirmSession: vi.fn(),
    cancelSession: vi.fn(),
    noShowSession: vi.fn(),
    completeSession: vi.fn(),
    checkInSession: vi.fn(),
    startTherapy: vi.fn(),
  },
  patientsClientMocks: {
    getPatient: vi.fn(),
  },
}));

vi.mock('../services/SitesHttpClient', () => ({
  SitesHttpClient: vi.fn().mockImplementation(() => ({ ...sitesClientMocks })),
}));

vi.mock('../services/SessionsHttpClient', () => ({
  SessionsHttpClient: vi.fn().mockImplementation(() => ({ ...sessionsClientMocks })),
}));

vi.mock('../services/PatientsHttpClient', () => ({
  PatientsHttpClient: vi.fn().mockImplementation(() => ({ ...patientsClientMocks })),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
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

function site(overrides: Partial<Site> = {}): Site {
  return {
    siteId: 1, siteName: 'Main Clinic', ruc: '123', inceptionDate: '2020-01-15',
    address: 'Somewhere', latitude: null, longitude: null,
    idleLogoffMinutes: 60, onSiteTripChargeAmount: 0, noShowFeePct: 30,
    ...overrides,
  };
}

/** Site as served by a pre-WP-42 API: noShowFeePct genuinely absent from the payload. */
function legacySite(overrides: Partial<Site> = {}): Site {
  const s = site(overrides);
  delete s.noShowFeePct;
  return s;
}

function appointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    sessionId: 42, sessionDate: '2026-07-31', sessionTime: '09:00',
    patient: 'Doe, Jane', therapist: 'Lopez, Maria', therapyTypes: 'TL',
    amount: 85, discount: 0, amountPaid: 0, amountDue: 85,
    isPastDue: false, isPaidOff: false, notes: '',
    patientId: 7, therapistId: 3, time: '09:00',
    appointmentStatusId: 2, statusName: 'Confirmed', isConfirmed: true,
    siteId: 1, siteName: 'Main Clinic',
    specialtyTypeId: 6, specialtyAbbreviation: 'TL', specialtyName: 'Language Therapy',
    isDiscovery: false,
    caretakerName: null, caretakerPhone: null, caretakerEmail: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  sitesClientMocks.getSites.mockResolvedValue([site()]);
  sitesClientMocks.getSite.mockResolvedValue(site());
  sitesClientMocks.createSite.mockResolvedValue(site());
  sitesClientMocks.updateSite.mockResolvedValue(undefined);
  sessionsClientMocks.updateSession.mockResolvedValue(undefined);
  sessionsClientMocks.confirmSession.mockResolvedValue(appointment());
  sessionsClientMocks.cancelSession.mockResolvedValue(appointment());
  sessionsClientMocks.noShowSession.mockResolvedValue(appointment());
  patientsClientMocks.getPatient.mockResolvedValue({ patientId: 7, hasSenadisDiscount: false });
});

// ── SiteFormModal — noShowFeePct field gating ────────────────────────────────

describe('SiteFormModal — noShowFeePct (WP-42)', () => {
  async function openForm(s: Site | null, role: string, opts: { isSystemAdmin?: boolean } = {}) {
    const wrapper = mount(SiteFormModal, {
      props: { visible: false, site: s },
      global: { plugins: [authAs(role, opts)], stubs: { teleport: true } },
    });
    await wrapper.setProps({ visible: true });
    await flushPromises();
    return wrapper;
  }

  it('SYSADMIN sees an editable fee input and the changed value is sent on PUT', async () => {
    const wrapper = await openForm(site({ noShowFeePct: 30 }), 'SYSADMIN', { isSystemAdmin: true });
    const input = wrapper.find('[data-testid="site-noshow-fee-input"]');
    expect(input.exists()).toBe(true);
    expect((input.element as HTMLInputElement).value).toBe('30');
    expect(wrapper.find('[data-testid="site-noshow-fee-readonly"]').exists()).toBe(false);

    await input.setValue('45.5');
    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(sitesClientMocks.updateSite).toHaveBeenCalled());
    expect(sitesClientMocks.updateSite).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ noShowFeePct: 45.5 }),
    );
  });

  it('non-SYSADMIN sees the fee read-only (no input) and the PUT echoes the stored value unchanged', async () => {
    const wrapper = await openForm(site({ noShowFeePct: 12.5 }), 'MGR');
    expect(wrapper.find('[data-testid="site-noshow-fee-input"]').exists()).toBe(false);
    const readonly = wrapper.find('[data-testid="site-noshow-fee-readonly"]');
    expect(readonly.exists()).toBe(true);
    expect(readonly.text()).toContain('12.50%');
    expect(wrapper.find('[data-testid="site-noshow-fee-sa-hint"]').exists()).toBe(true);

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(sitesClientMocks.updateSite).toHaveBeenCalled());
    // Echoed-unchanged passes the API field-gate; a changed value would 403.
    expect(sitesClientMocks.updateSite).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ noShowFeePct: 12.5 }),
    );
  });

  it('rejects an out-of-range fee client-side (API would 400 anyway)', async () => {
    const wrapper = await openForm(site(), 'SYSADMIN', { isSystemAdmin: true });
    await wrapper.find('[data-testid="site-noshow-fee-input"]').setValue('150');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(sitesClientMocks.updateSite).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('between 0 and 100');
  });

  it('older API (field absent): fee UI hidden and the PUT never sends noShowFeePct', async () => {
    const wrapper = await openForm(legacySite(), 'SYSADMIN', { isSystemAdmin: true });
    expect(wrapper.find('[data-testid="site-noshow-fee-input"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="site-noshow-fee-readonly"]').exists()).toBe(false);

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(sitesClientMocks.updateSite).toHaveBeenCalled());
    expect(sitesClientMocks.updateSite.mock.calls[0][1]).not.toHaveProperty('noShowFeePct');
  });

  async function fillRequiredCreateFields(wrapper: ReturnType<typeof mount>) {
    await wrapper.find('input[type="text"]').setValue('New Site'); // first text input = Site Name
    await wrapper.find('input[type="date"]').setValue('2026-01-01');
  }

  it('create mode: SYSADMIN sends the default 30 on POST', async () => {
    const wrapper = await openForm(null, 'SYSADMIN', { isSystemAdmin: true });
    expect((wrapper.find('[data-testid="site-noshow-fee-input"]').element as HTMLInputElement).value).toBe('30');
    await fillRequiredCreateFields(wrapper);
    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(sitesClientMocks.createSite).toHaveBeenCalled());
    expect(sitesClientMocks.createSite.mock.calls[0][0]).toMatchObject({ noShowFeePct: 30 });
  });

  it('create mode: non-SYSADMIN omits the field on POST (API defaults 30; sending non-30 would 403)', async () => {
    const wrapper = await openForm(null, 'MGR');
    expect(wrapper.find('[data-testid="site-noshow-fee-readonly"]').text()).toContain('30.00%');
    await fillRequiredCreateFields(wrapper);
    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(sitesClientMocks.createSite).toHaveBeenCalled());
    expect(sitesClientMocks.createSite.mock.calls[0][0]).not.toHaveProperty('noShowFeePct');
  });
});

// ── ActionsPanel — cancel pre-confirm money note + guard 400 ─────────────────

async function openPanel(appt: Appointment, role = 'MGR') {
  const pinia = authAs(role);
  const wrapper = mount(ActionsPanel, {
    props: { visible: true, appointment: appt },
    global: { plugins: [pinia], stubs: { teleport: true } },
  });
  await flushPromises();
  return wrapper;
}

describe('ActionsPanel — cancel money note (WP-42)', () => {
  it('shows the zeroing note when the session carries money', async () => {
    const wrapper = await openPanel(appointment({ amount: 85 }));
    const note = wrapper.find('[data-testid="cancel-money-note"]');
    expect(note.exists()).toBe(true);
    expect(note.text()).toContain('$85.00');
    expect(note.text()).toContain('zeroes');
  });

  it('hides the note when the session money is already zero', async () => {
    const wrapper = await openPanel(appointment({ amount: 0, amountDue: 0 }));
    expect(wrapper.find('[data-testid="cancel-money-note"]').exists()).toBe(false);
  });

  it('surfaces the money-moved guard 400 detail verbatim', async () => {
    sessionsClientMocks.cancelSession.mockRejectedValueOnce(new Error(GUARD_PAYMENTS_DETAIL));
    const wrapper = await openPanel(appointment({ amountPaid: 15 }));
    await wrapper.find('[data-testid="cancel-appointment-btn"]').trigger('click');
    await flushPromises();

    const errorBox = wrapper.find('[data-testid="action-error"]');
    expect(errorBox.exists()).toBe(true);
    expect(errorBox.text()).toContain(GUARD_PAYMENTS_DETAIL);
    expect(wrapper.emitted('close')).toBeFalsy(); // panel stays open so the user can act
  });

  it('surfaces the covered-by-service-payment guard 400 detail verbatim', async () => {
    sessionsClientMocks.cancelSession.mockRejectedValueOnce(new Error(GUARD_COVERED_DETAIL));
    const wrapper = await openPanel(appointment());
    await wrapper.find('[data-testid="cancel-appointment-btn"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="action-error"]').text()).toContain(GUARD_COVERED_DETAIL);
  });
});

// ── ActionsPanel — no-show confirm step + fee line ───────────────────────────

describe('ActionsPanel — no-show fee confirm step (WP-42)', () => {
  it('clicking No Show opens the confirm step with the computed fee line; no transition yet', async () => {
    sitesClientMocks.getSite.mockResolvedValue(site({ noShowFeePct: 30 }));
    const wrapper = await openPanel(appointment({ amount: 85 }));

    await wrapper.find('[data-testid="status-action-5"]').trigger('click');
    await flushPromises();

    expect(sessionsClientMocks.noShowSession).not.toHaveBeenCalled();
    const line = wrapper.find('[data-testid="noshow-fee-line"]');
    expect(line.exists()).toBe(true);
    expect(line.text()).toBe('A no-show fee of 30% of $85.00 (= $25.50) will be charged.');

    await wrapper.find('[data-testid="noshow-confirm-btn"]').trigger('click');
    await vi.waitFor(() => expect(sessionsClientMocks.noShowSession).toHaveBeenCalledWith(42));
  });

  it('fee math matches the API rounding: 12.5% of $85.00 = $10.63', async () => {
    sitesClientMocks.getSite.mockResolvedValue(site({ noShowFeePct: 12.5 }));
    const wrapper = await openPanel(appointment({ amount: 85 }));
    await wrapper.find('[data-testid="status-action-5"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="noshow-fee-line"]').text())
      .toBe('A no-show fee of 12.5% of $85.00 (= $10.63) will be charged.');
  });

  it('falls back to the generic line when the site is unreachable', async () => {
    sitesClientMocks.getSite.mockRejectedValueOnce(new Error('network'));
    const wrapper = await openPanel(appointment());
    await wrapper.find('[data-testid="status-action-5"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="noshow-fee-line"]').text())
      .toBe("The site's no-show fee will apply to this session.");
  });

  it('falls back to the generic line when the site payload has no pct (older API)', async () => {
    sitesClientMocks.getSite.mockResolvedValue(legacySite());
    const wrapper = await openPanel(appointment());
    await wrapper.find('[data-testid="status-action-5"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="noshow-fee-line"]').text())
      .toBe("The site's no-show fee will apply to this session.");
  });

  it('falls back to the generic line when the session has no site', async () => {
    const wrapper = await openPanel(appointment({ siteId: null, siteName: null }));
    await wrapper.find('[data-testid="status-action-5"]').trigger('click');
    await flushPromises();

    expect(sitesClientMocks.getSite).not.toHaveBeenCalled();
    expect(wrapper.find('[data-testid="noshow-fee-line"]').text())
      .toBe("The site's no-show fee will apply to this session.");
  });

  it('Back dismisses the confirm step without transitioning', async () => {
    const wrapper = await openPanel(appointment());
    await wrapper.find('[data-testid="status-action-5"]').trigger('click');
    await flushPromises();
    await wrapper.find('[data-testid="noshow-back-btn"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="noshow-confirm"]').exists()).toBe(false);
    expect(sessionsClientMocks.noShowSession).not.toHaveBeenCalled();
  });

  it('surfaces a guard 400 from the no-show transition verbatim', async () => {
    sessionsClientMocks.noShowSession.mockRejectedValueOnce(new Error(GUARD_COVERED_DETAIL));
    const wrapper = await openPanel(appointment());
    await wrapper.find('[data-testid="status-action-5"]').trigger('click');
    await flushPromises();
    await wrapper.find('[data-testid="noshow-confirm-btn"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="action-error"]').text()).toContain(GUARD_COVERED_DETAIL);
    expect(wrapper.emitted('close')).toBeFalsy();
  });
});

// ── ActionsPanel — Declined confirmation (routes to Cancelled) ───────────────

describe('ActionsPanel — Declined confirmation (WP-42)', () => {
  it('selecting Declined on a money-carrying session shows the zeroing note', async () => {
    const wrapper = await openPanel(appointment({ appointmentStatusId: 1, statusName: 'Proposed', amount: 85 }));
    expect(wrapper.find('[data-testid="declined-money-note"]').exists()).toBe(false);

    await wrapper.find('[data-testid="confirm-result-declined"]').trigger('click');
    expect(wrapper.find('[data-testid="declined-money-note"]').text()).toContain('$85.00');
  });

  it('hides the Declined note when the session money is zero', async () => {
    const wrapper = await openPanel(appointment({ appointmentStatusId: 1, statusName: 'Proposed', amount: 0, amountDue: 0 }));
    await wrapper.find('[data-testid="confirm-result-declined"]').trigger('click');
    expect(wrapper.find('[data-testid="declined-money-note"]').exists()).toBe(false);
  });

  it('surfaces a Declined guard 400 detail verbatim', async () => {
    sessionsClientMocks.confirmSession.mockRejectedValueOnce(new Error(GUARD_PAYMENTS_DETAIL));
    const wrapper = await openPanel(appointment({ appointmentStatusId: 1, statusName: 'Proposed', amountPaid: 15 }));
    await wrapper.find('[data-testid="confirm-result-declined"]').trigger('click');
    await wrapper.find('[data-testid="confirm-submit-btn"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="action-error"]').text()).toContain(GUARD_PAYMENTS_DETAIL);
    expect(wrapper.emitted('close')).toBeFalsy();
  });
});

// ── HttpClientBase — the WP-42B ProblemDetails detail strings render cleanly ──

describe('HttpClientBase — WP-42 guard ProblemDetails extraction', () => {
  class TestClient extends HttpClientBase {
    postTest(url: string): Promise<unknown> {
      return this.post(url, {});
    }
  }

  function problemResponse(detail: string): Response {
    return {
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ title: 'Bad Request', status: 400, detail }),
    } as unknown as Response;
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([GUARD_PAYMENTS_DETAIL, GUARD_COVERED_DETAIL])(
    'a 400 ProblemDetails body surfaces its exact detail: %s',
    async (detail) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(problemResponse(detail)));
      const client = new TestClient();
      await expect(client.postTest('/api/sessions/42/cancel')).rejects.toThrow(detail);
    },
  );
});
