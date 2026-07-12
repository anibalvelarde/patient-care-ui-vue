// WP-21C (F1) — Session History tab behavior.
//
// The panel is server-paged on BOTH axes: the patient list (30/page, most-recent-session first,
// server-side search) and each expanded patient's sessions (25/page, newest first). Rows are
// read-only and link to the Dashboard view of the session with the Delinquent-style `from`
// back-banner param.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory, type Router } from 'vue-router';
import SessionHistoryPanel from '../components/patients/SessionHistoryPanel.vue';
import PatientSessionsTable from '../components/patients/PatientSessionsTable.vue';
import type { PagedResult, PatientSessionHistorySummary, PatientHistorySession } from '../interfaces/SessionHistory';

const { getSessionHistoryMock, getPatientSessionsMock } = vi.hoisted(() => ({
  getSessionHistoryMock: vi.fn(),
  getPatientSessionsMock: vi.fn(),
}));

vi.mock('../services/PatientsHttpClient', () => ({
  PatientsHttpClient: vi.fn().mockImplementation(() => ({
    getSessionHistory: getSessionHistoryMock,
    getPatientSessions: getPatientSessionsMock,
  })),
}));

function summaryPage(overrides: Partial<PagedResult<PatientSessionHistorySummary>> = {}): PagedResult<PatientSessionHistorySummary> {
  return {
    items: [
      { patientId: 1, patientName: 'Anderson, Amy', medicalRecordNumber: 'L24-0001', lastSessionDate: '2026-07-01', totalSessions: 3 },
      { patientId: 2, patientName: 'Bennet, Neya', medicalRecordNumber: 'L25-0034', lastSessionDate: '2026-06-15', totalSessions: 132 },
    ],
    page: 1,
    pageSize: 30,
    totalCount: 65,
    ...overrides,
  };
}

function sessionsPage(overrides: Partial<PagedResult<PatientHistorySession>> = {}): PagedResult<PatientHistorySession> {
  return {
    items: [
      {
        sessionId: 42, sessionDate: '2026-07-01', sessionTime: '09:00:00', therapist: 'Smith, Jane',
        therapyTypes: 'PSICOT', specialtyName: 'Psicoterapia', specialtyAbbreviation: 'PSICOT',
        amount: 45, discount: 0, amountPaid: 45, amountDue: 0, isPaidOff: true, statusName: 'Completed',
      },
      {
        sessionId: 41, sessionDate: '2026-06-15', sessionTime: '14:00:00', therapist: 'Smith, Jane',
        therapyTypes: 'EEG', specialtyName: 'EEG', specialtyAbbreviation: 'EEG',
        amount: 75, discount: 10, amountPaid: 0, amountDue: 65, isPaidOff: false, statusName: 'Completed',
      },
    ],
    page: 1,
    pageSize: 25,
    totalCount: 132,
    ...overrides,
  };
}

function makeRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:rest(.*)*', component: { template: '<div/>' } }],
  });
}

async function mountPanel(search = '') {
  const router = makeRouter();
  router.push('/patients');
  await router.isReady();
  const wrapper = mount(SessionHistoryPanel, {
    props: { search },
    global: { plugins: [router] },
  });
  await flushPromises();
  return wrapper;
}

beforeEach(() => {
  getSessionHistoryMock.mockReset().mockResolvedValue(summaryPage());
  getPatientSessionsMock.mockReset().mockResolvedValue(sessionsPage());
});

afterEach(() => {
  vi.useRealTimers();
});

describe('SessionHistoryPanel — paged patient list', () => {
  it('loads page 1 on mount and renders patient rows with recency aggregates', async () => {
    const w = await mountPanel();

    expect(getSessionHistoryMock).toHaveBeenCalledWith('', 1, 30);
    expect(w.text()).toContain('Anderson, Amy');
    expect(w.text()).toContain('L24-0001');
    expect(w.text()).toContain('07/01/2026');
    expect(w.text()).toContain('132'); // Bennet's totalSessions badge
    expect(w.text()).toContain('Page 1 of 3');
    expect(w.text()).toContain('65 patients');
  });

  it('pages forward and disables Prev/Next at the bounds', async () => {
    const w = await mountPanel();
    const footerButtons = () => w.findAll('button').filter((b) => b.text().includes('Prev') || b.text().includes('Next'));

    const [prev1, next1] = footerButtons();
    expect(prev1.attributes('disabled')).toBeDefined();
    expect(next1.attributes('disabled')).toBeUndefined();

    // 35 patients → exactly 2 pages, so page 2 is the last.
    getSessionHistoryMock.mockResolvedValueOnce(summaryPage({ page: 2, totalCount: 35 }));
    await next1.trigger('click');
    await flushPromises();
    expect(getSessionHistoryMock).toHaveBeenLastCalledWith('', 2, 30);

    const [prev2, next2] = footerButtons();
    expect(w.text()).toContain('Page 2 of 2');
    expect(prev2.attributes('disabled')).toBeUndefined();
    expect(next2.attributes('disabled')).toBeDefined();
  });

  it('debounces search changes and restarts from page 1', async () => {
    vi.useFakeTimers();
    const w = await mountPanel();
    getSessionHistoryMock.mockClear();

    await w.setProps({ search: 'ben' });
    await w.setProps({ search: 'benn' });
    expect(getSessionHistoryMock).not.toHaveBeenCalled(); // still inside the debounce window

    vi.advanceTimersByTime(300);
    await flushPromises();
    expect(getSessionHistoryMock).toHaveBeenCalledTimes(1);
    expect(getSessionHistoryMock).toHaveBeenCalledWith('benn', 1, 30);
  });

  it('shows the empty state when the search matches nothing', async () => {
    getSessionHistoryMock.mockResolvedValue(summaryPage({ items: [], totalCount: 0 }));
    const w = await mountPanel('zzz');
    expect(w.text()).toContain('No patients found.');
  });
});

describe('SessionHistoryPanel — expanding a patient', () => {
  it('fetches and renders that patient\'s sessions on first expand', async () => {
    const w = await mountPanel();

    await w.find('tbody tr').trigger('click'); // expand Anderson (patientId 1)
    await flushPromises();

    expect(getPatientSessionsMock).toHaveBeenCalledWith(1, 1, 25);
    expect(w.text()).toContain('Psicoterapia');
    expect(w.text()).toContain('Smith, Jane');
    expect(w.text()).toContain('Page 1 of 6'); // 132 sessions / 25 per page
  });
});

describe('PatientSessionsTable — read-only rows', () => {
  async function mountTable() {
    const router = makeRouter();
    router.push('/patients');
    await router.isReady();
    const wrapper = mount(PatientSessionsTable, {
      props: { patientId: 7 },
      global: { plugins: [router] },
    });
    await flushPromises();
    return wrapper;
  }

  it('links each session to the Dashboard with date, highlight, and the sessions-tab back param', async () => {
    const w = await mountTable();

    const links = w.findAllComponents({ name: 'RouterLink' });
    expect(links.length).toBe(2);
    expect(links[0].props('to')).toEqual({
      path: '/',
      query: { date: '2026-07-01', highlightSession: '42', from: '/patients?tab=sessions' },
    });
  });

  it('marks paid-off sessions with the paid badge and unpaid ones amber', async () => {
    const w = await mountTable();

    const paid = w.find('[title="Paid $45.00"]');
    expect(paid.exists()).toBe(true);
    const due = w.find('[title="$65.00 due"]');
    expect(due.exists()).toBe(true);
  });

  it('shows the empty state for a patient with no sessions', async () => {
    getPatientSessionsMock.mockResolvedValue(sessionsPage({ items: [], totalCount: 0 }));
    const w = await mountTable();
    expect(w.text()).toContain('No sessions on record for this patient.');
  });

  it('pages sessions independently (25/page)', async () => {
    const w = await mountTable();
    getPatientSessionsMock.mockClear();

    const next = w.findAll('button').find((b) => b.text().includes('Next'))!;
    await next.trigger('click');
    await flushPromises();

    expect(getPatientSessionsMock).toHaveBeenCalledWith(7, 2, 25);
  });
});
