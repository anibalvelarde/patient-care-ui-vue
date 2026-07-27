// WP-35C — Session History Pack (SH-1/2/3).
//
// SH-1: the patient summary row gains a "From" (first-session) date so it reads From/Through;
//       the field is additive and OPTIONAL — an older API during rollout won't send it, and the
//       row must render gracefully ("—") when it's absent or null.
// SH-2: per-session rows show a notes icon ONLY when the session has notes; tapping it reveals
//       the FULL note content (ruling G2 — Dashboard › Appointments pattern made tappable, via
//       the WP-31 AuditPopover mechanics).
// SH-3: "Print / Save as PDF" opens a date-range dialog defaulted + clamped to the patient's
//       actual session span, fetches ALL sessions in range by looping the paged endpoint with
//       from/to, and renders a print-only layout (rulings G3+G4 — print-CSS + window.print()).
//
// Dates are deterministic fixtures (far-past/far-future style) — no fake timers (WP-37 DoD note).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory, type Router } from 'vue-router';
import SessionHistoryPanel from '../components/patients/SessionHistoryPanel.vue';
import PatientSessionsTable from '../components/patients/PatientSessionsTable.vue';
import SessionHistoryPrintDialog from '../components/patients/SessionHistoryPrintDialog.vue';
import type { PagedResult, PatientSessionHistorySummary, PatientHistorySession, SessionHistoryPagedResult } from '../interfaces/SessionHistory';

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

// ---------- factories ----------

function summary(overrides: Partial<PatientSessionHistorySummary> = {}): PatientSessionHistorySummary {
  return {
    patientId: 1,
    patientName: 'Anderson, Amy',
    medicalRecordNumber: 'L24-0001',
    firstSessionDate: '2025-01-05',
    lastSessionDate: '2026-07-01',
    totalSessions: 3,
    ...overrides,
  };
}

function summaryPage(items: PatientSessionHistorySummary[], extra: Partial<SessionHistoryPagedResult> = {}): SessionHistoryPagedResult {
  return { items, page: 1, pageSize: 30, totalCount: items.length, ...extra };
}

function session(overrides: Partial<PatientHistorySession> = {}): PatientHistorySession {
  return {
    sessionId: 42, sessionDate: '2026-07-01', sessionTime: '09:00:00', therapist: 'Smith, Jane',
    therapyTypes: 'PSICOT', specialtyName: 'Psicoterapia', specialtyAbbreviation: 'PSICOT',
    amount: 45, discount: 0, amountPaid: 45, amountDue: 0, isPaidOff: true,
    appointmentStatusId: 4, statusName: 'Completed',
    ...overrides,
  };
}

function sessionsPage(items: PatientHistorySession[], overrides: Partial<PagedResult<PatientHistorySession>> = {}): PagedResult<PatientHistorySession> {
  return { items, page: 1, pageSize: 25, totalCount: items.length, ...overrides };
}

const LONG_NOTE =
  'Patient arrived 15 minutes late due to transport issues. Worked on fine-motor sequencing with ' +
  'the bead board; showed marked improvement over last week. Caretaker asked about the home ' +
  'exercise plan — resent the printed copy and walked through steps 3 and 4 in detail. Follow up ' +
  'next session on left-hand grip strength.';

function makeRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:rest(.*)*', component: { template: '<div/>' } }],
  });
}

async function mountPanel() {
  const router = makeRouter();
  router.push('/patients');
  await router.isReady();
  const wrapper = mount(SessionHistoryPanel, {
    props: { search: '' },
    global: { plugins: [router], stubs: { teleport: true } },
  });
  await flushPromises();
  return wrapper;
}

async function mountTable(patientId = 7) {
  const router = makeRouter();
  router.push('/patients');
  await router.isReady();
  const wrapper = mount(PatientSessionsTable, {
    props: { patientId },
    global: { plugins: [router], stubs: { teleport: true } },
  });
  await flushPromises();
  return { wrapper, router };
}

beforeEach(() => {
  getSessionHistoryMock.mockReset().mockResolvedValue(summaryPage([summary()]));
  getPatientSessionsMock.mockReset().mockResolvedValue(sessionsPage([session()]));
  // jsdom's window.print is "not implemented" — replace it per test run.
  window.print = vi.fn();
});

afterEach(() => {
  document.body.classList.remove('shp-print-mode');
  vi.useRealTimers();
});

// ---------- SH-1: From/Through on the summary row ----------

describe('SH-1 — From (first-session) date on the summary row', () => {
  it('renders the first-session date so the row reads From/Through', async () => {
    const w = await mountPanel();

    const fromCell = w.find('[data-testid="session-history-from"]');
    expect(fromCell.exists()).toBe(true);
    expect(fromCell.text()).toBe('01/05/2025');
    expect(w.text()).toContain('07/01/2026'); // Last Session still there
  });

  it('renders "—" when firstSessionDate is null (zero-session patient)', async () => {
    getSessionHistoryMock.mockResolvedValue(summaryPage([
      summary({ patientId: 9, patientName: 'Newman, Zero', firstSessionDate: null, lastSessionDate: null, totalSessions: 0 }),
    ]));
    const w = await mountPanel();

    expect(w.find('[data-testid="session-history-from"]').text()).toBe('—');
  });

  it('tolerates the field being ABSENT entirely (older API during rollout)', async () => {
    // Build a payload whose rows simply don't carry the key at all.
    const legacyRow = summary({ patientId: 3, patientName: 'Old-Api, Row' });
    delete (legacyRow as Partial<PatientSessionHistorySummary>).firstSessionDate;
    getSessionHistoryMock.mockResolvedValue(summaryPage([legacyRow]));

    const w = await mountPanel();

    expect(w.find('[data-testid="session-history-from"]').text()).toBe('—');
    expect(w.text()).toContain('Old-Api, Row'); // row still renders, no crash
  });
});

// ---------- Money addendum: per-patient columns + overall totals band ----------
// The money keys ride Appointments.ProviderAmount: the API OMITS them from the wire for
// FD/ACCT (not null, not 0). Presence-in-payload is the UI's single render gate — it covers
// both claim-shaping and an older API during rollout.

describe('Money addendum — columns and band when the API sends money', () => {
  const MONEY_TOTALS = { sessionCount: 10930, grossAmount: 667293.5, discountAmount: 1200, grossProfit: 52000.75 };

  it('renders Gross / Discount / Gross Profit columns with house currency formatting', async () => {
    getSessionHistoryMock.mockResolvedValue(summaryPage(
      [summary({ grossAmount: 1350.5, discountAmount: 25, grossProfit: 400.25 })],
      { totals: MONEY_TOTALS },
    ));
    const w = await mountPanel();

    expect(w.text()).toContain('Gross Profit'); // column header present
    expect(w.find('[data-testid="session-history-gross"]').text()).toBe('$1,350.50');
    expect(w.find('[data-testid="session-history-discount"]').text()).toBe('$25.00');
    expect(w.find('[data-testid="session-history-gross-profit"]').text()).toBe('$400.25');
    // mobile card money line too
    expect(w.find('[data-testid="session-history-money-mobile"]').exists()).toBe(true);
  });

  it('band shows patient count, session count, and the SERVER totals (full filtered set, not client row math)', async () => {
    // Row money deliberately does NOT sum to the totals — the band must echo the envelope.
    getSessionHistoryMock.mockResolvedValue(summaryPage(
      [summary({ grossAmount: 1350.5, discountAmount: 25, grossProfit: 400.25 })],
      { totalCount: 866, totals: MONEY_TOTALS },
    ));
    const w = await mountPanel();

    expect(w.find('[data-testid="session-history-totals-patients"]').text()).toBe('866');
    expect(w.find('[data-testid="session-history-totals-sessions"]').text()).toBe('10930');
    expect(w.find('[data-testid="session-history-totals-gross"]').text()).toBe('$667,293.50');
    expect(w.find('[data-testid="session-history-totals-discount"]').text()).toBe('$1,200.00');
    expect(w.find('[data-testid="session-history-totals-gross-profit"]').text()).toBe('$52,000.75');
  });

  it('band re-renders from the fresh envelope when the search changes', async () => {
    getSessionHistoryMock.mockResolvedValue(summaryPage(
      [summary({ grossAmount: 1350.5, discountAmount: 25, grossProfit: 400.25 })],
      { totalCount: 866, totals: MONEY_TOTALS },
    ));
    const w = await mountPanel();
    expect(w.find('[data-testid="session-history-totals-gross"]').text()).toBe('$667,293.50');

    // Narrowed search → the server aggregates the filtered set and returns smaller totals.
    getSessionHistoryMock.mockResolvedValue(summaryPage(
      [summary({ grossAmount: 1350.5, discountAmount: 25, grossProfit: 400.25 })],
      { totalCount: 1, totals: { sessionCount: 3, grossAmount: 1350.5, discountAmount: 25, grossProfit: 400.25 } },
    ));
    vi.useFakeTimers(); // the panel's search watch debounces via a real setTimeout
    await w.setProps({ search: 'anderson' });
    vi.advanceTimersByTime(300);
    await flushPromises();

    expect(getSessionHistoryMock).toHaveBeenLastCalledWith('anderson', 1, 30);
    expect(w.find('[data-testid="session-history-totals-patients"]').text()).toBe('1');
    expect(w.find('[data-testid="session-history-totals-sessions"]').text()).toBe('3');
    expect(w.find('[data-testid="session-history-totals-gross"]').text()).toBe('$1,350.50');
  });
});

describe('Money addendum — counts-only callers and older APIs', () => {
  it('FD/ACCT shaping: money keys absent → no money columns and no $ in the band, counts still shown', async () => {
    // summary() carries no money keys, mirroring the shaped wire (omitted, not 0).
    getSessionHistoryMock.mockResolvedValue(summaryPage(
      [summary()],
      { totalCount: 866, totals: { sessionCount: 10930 } },
    ));
    const w = await mountPanel();

    expect(w.find('[data-testid="session-history-gross"]').exists()).toBe(false);
    expect(w.find('[data-testid="session-history-money-mobile"]').exists()).toBe(false);
    expect(w.text()).not.toContain('Gross'); // neither column headers nor band tiles
    const band = w.find('[data-testid="session-history-totals-band"]');
    expect(band.find('[data-testid="session-history-totals-patients"]').text()).toBe('866');
    expect(band.find('[data-testid="session-history-totals-sessions"]').text()).toBe('10930');
    expect(band.text()).not.toContain('$'); // absent means absent — never $0.00
  });

  it('older API (plain PagedResult, no totals at all): page still renders, band shows the patient count only', async () => {
    getSessionHistoryMock.mockResolvedValue(summaryPage([summary()]) as PagedResult<PatientSessionHistorySummary>);
    const w = await mountPanel();

    expect(w.text()).toContain('Anderson, Amy'); // no crash
    expect(w.find('[data-testid="session-history-totals-patients"]').text()).toBe('1');
    expect(w.find('[data-testid="session-history-totals-sessions"]').exists()).toBe(false);
    expect(w.find('[data-testid="session-history-totals-band"]').text()).not.toContain('$');
  });
});

// ---------- SH-2: notes icon + full-content reveal ----------

describe('SH-2 — notes icon and full-text reveal', () => {
  it('shows the notes icon only on rows whose session has notes', async () => {
    getPatientSessionsMock.mockResolvedValue(sessionsPage([
      session({ sessionId: 1, notes: LONG_NOTE }),
      session({ sessionId: 2, sessionDate: '2026-06-15', notes: '' }),
      session({ sessionId: 3, sessionDate: '2026-06-01' }), // notes absent entirely
    ]));
    const { wrapper: w } = await mountTable();

    // One noted session renders the trigger twice (desktop grid + mobile card variants).
    expect(w.findAll('[data-testid="notes-button"]').length).toBe(2);
  });

  it('renders no icon at all when no session has notes', async () => {
    getPatientSessionsMock.mockResolvedValue(sessionsPage([session(), session({ sessionId: 2, notes: '   ' })]));
    const { wrapper: w } = await mountTable();

    expect(w.findAll('[data-testid="notes-button"]').length).toBe(0);
  });

  it('tap reveals the FULL note content, no truncation', async () => {
    getPatientSessionsMock.mockResolvedValue(sessionsPage([session({ notes: LONG_NOTE })]));
    const { wrapper: w } = await mountTable();

    await w.find('[data-testid="notes-button"]').trigger('click');

    const popover = w.find('[data-testid="notes-popover"]');
    expect(popover.exists()).toBe(true);
    expect(w.find('[data-testid="notes-content"]').text()).toBe(LONG_NOTE);
  });

  it('tapping the icon does NOT navigate the row link, and Escape closes the popover', async () => {
    getPatientSessionsMock.mockResolvedValue(sessionsPage([session({ notes: LONG_NOTE })]));
    const { wrapper: w, router } = await mountTable();

    await w.find('[data-testid="notes-button"]').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/patients'); // still on the tab, not the Dashboard

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await flushPromises();
    expect(w.find('[data-testid="notes-popover"]').exists()).toBe(false);
  });
});

// ---------- SH-3: date-range dialog + print view ----------

describe('SH-3 — print action on the panel', () => {
  it('disables the print button for a zero-session patient and opens the dialog otherwise', async () => {
    getSessionHistoryMock.mockResolvedValue(summaryPage([
      summary(),
      summary({ patientId: 9, patientName: 'Newman, Zero', firstSessionDate: null, lastSessionDate: null, totalSessions: 0 }),
    ]));
    const w = await mountPanel();

    const buttons = w.findAll('[data-testid="session-history-print"]');
    expect(buttons.length).toBe(2);
    expect(buttons[0].attributes('disabled')).toBeUndefined();
    expect(buttons[1].attributes('disabled')).toBeDefined();

    expect(w.find('[data-testid="shp-print-dialog"]').exists()).toBe(false);
    await buttons[0].trigger('click');
    const dialog = w.find('[data-testid="shp-print-dialog"]');
    expect(dialog.exists()).toBe(true);
    expect(dialog.text()).toContain('Anderson, Amy');
  });
});

describe('SH-3 — date-range dialog defaults and clamping', () => {
  function mountDialog(patient: PatientSessionHistorySummary = summary()) {
    return mount(SessionHistoryPrintDialog, {
      props: { patient, visible: true },
      global: { stubs: { teleport: true } },
    });
  }

  it('defaults From/Through to the patient\'s actual first–last session span, clamped to it', () => {
    const w = mountDialog();

    const from = w.find('[data-testid="shp-print-from"]').element as HTMLInputElement;
    const to = w.find('[data-testid="shp-print-to"]').element as HTMLInputElement;
    expect(from.value).toBe('2025-01-05');
    expect(to.value).toBe('2026-07-01');
    // min/max clamp = the span, on both pickers
    expect(from.min).toBe('2025-01-05');
    expect(from.max).toBe('2026-07-01');
    expect(to.min).toBe('2025-01-05');
    expect(to.max).toBe('2026-07-01');
    expect(w.find('[data-testid="shp-print-range-error"]').exists()).toBe(false);
  });

  it('rejects dates typed outside the span and inverted ranges (Confirm disabled)', async () => {
    const w = mountDialog();

    // Below the clamp (typed, so the native min can't stop it)
    await w.find('[data-testid="shp-print-from"]').setValue('2024-12-31');
    expect(w.find('[data-testid="shp-print-range-error"]').exists()).toBe(true);
    expect(w.find('[data-testid="shp-print-confirm"]').attributes('disabled')).toBeDefined();

    // Inverted range
    await w.find('[data-testid="shp-print-from"]').setValue('2026-06-01');
    await w.find('[data-testid="shp-print-to"]').setValue('2026-05-01');
    expect(w.find('[data-testid="shp-print-range-error"]').exists()).toBe(true);

    // Back inside the span → valid again
    await w.find('[data-testid="shp-print-to"]').setValue('2026-06-30');
    expect(w.find('[data-testid="shp-print-range-error"]').exists()).toBe(false);
    expect(w.find('[data-testid="shp-print-confirm"]').attributes('disabled')).toBeUndefined();
  });

  it('tolerates an absent firstSessionDate (older API): defaults From to the last-session date, lower bound unclamped', () => {
    const legacy = summary({ patientId: 3 });
    delete (legacy as Partial<PatientSessionHistorySummary>).firstSessionDate;
    const w = mountDialog(legacy);

    const from = w.find('[data-testid="shp-print-from"]').element as HTMLInputElement;
    expect(from.value).toBe('2026-07-01');
    expect(from.min).toBe('');
  });
});

describe('SH-3 — print view assembles all pages and prints', () => {
  // 130 sessions across 2 pages of 100 (server-clamped max), returned newest-first like the API.
  function makeRangedSessions(count: number): PatientHistorySession[] {
    const all: PatientHistorySession[] = [];
    for (let i = 0; i < count; i++) {
      // Descending dates: 2026-05-<n> style is unnecessary — use a shifted day counter.
      const day = count - i; // newest first
      const month = String(Math.floor((day - 1) / 28) + 1).padStart(2, '0');
      const dom = String(((day - 1) % 28) + 1).padStart(2, '0');
      all.push(session({
        sessionId: 1000 + day,
        sessionDate: `2026-${month}-${dom}`,
        notes: day === 1 ? LONG_NOTE : day === count ? 'Short closing note.' : undefined,
      }));
    }
    return all;
  }

  function pagedMock(all: PatientHistorySession[], pageSize: number) {
    getPatientSessionsMock.mockImplementation((_id: number, page: number) =>
      Promise.resolve(sessionsPage(
        all.slice((page - 1) * pageSize, page * pageSize),
        { page, pageSize, totalCount: all.length },
      )));
  }

  async function confirmPrint(patient: PatientSessionHistorySummary = summary()) {
    const w = mount(SessionHistoryPrintDialog, {
      props: { patient, visible: true },
      global: { stubs: { teleport: true } },
    });
    await w.find('[data-testid="shp-print-confirm"]').trigger('click');
    await flushPromises();
    return w;
  }

  it('loops the paged endpoint with from/to until all pages are collected, then prints', async () => {
    const all = makeRangedSessions(130);
    pagedMock(all, 100);
    let bodyHiddenDuringPrint = false;
    window.print = vi.fn(() => {
      // While the print dialog is up, the app chrome must be hidden (body.shp-print-mode + CSS
      // hides #app; the report is teleported to <body> so it's the only thing that prints).
      bodyHiddenDuringPrint = document.body.classList.contains('shp-print-mode');
    });

    const w = await confirmPrint();

    expect(getPatientSessionsMock).toHaveBeenNthCalledWith(1, 1, 1, 100, '2025-01-05', '2026-07-01');
    expect(getPatientSessionsMock).toHaveBeenNthCalledWith(2, 1, 2, 100, '2025-01-05', '2026-07-01');
    expect(getPatientSessionsMock).toHaveBeenCalledTimes(2);

    const root = w.find('[data-testid="shp-print-root"]');
    expect(root.exists()).toBe(true);
    expect(w.findAll('[data-testid="shp-print-session-row"]').length).toBe(130); // both pages assembled
    expect(w.find('[data-testid="shp-print-count"]').text()).toContain('130 sessions');

    expect(window.print).toHaveBeenCalledTimes(1);
    expect(bodyHiddenDuringPrint).toBe(true);
    expect(document.body.classList.contains('shp-print-mode')).toBe(false); // cleaned up after
    expect(w.emitted('close')).toBeTruthy();
  });

  it('prints the header (clinic · patient+MRN · printed-on · chosen range) and chronological rows', async () => {
    pagedMock(makeRangedSessions(130), 100);
    const w = await confirmPrint();

    expect(w.find('[data-testid="shp-print-root"]').text()).toContain('NeuroCorp Therapy Center');
    expect(w.find('[data-testid="shp-print-patient"]').text()).toContain('Anderson, Amy');
    expect(w.find('[data-testid="shp-print-patient"]').text()).toContain('L24-0001');
    expect(w.find('[data-testid="shp-print-range"]').text()).toContain('from 01/05/2025 through 07/01/2026');
    expect(w.find('[data-testid="shp-print-range"]').text()).toContain('Printed on');

    // API returns newest-first; the report reads chronologically (oldest first).
    const rows = w.findAll('[data-testid="shp-print-session-row"]');
    expect(rows[0].text()).toContain('01/01/2026');
  });

  it('prints each session\'s FULL note inline beneath its row and omits the line otherwise — and never ProviderAmount', async () => {
    pagedMock(makeRangedSessions(130), 100);
    const w = await confirmPrint();

    const notes = w.findAll('[data-testid="shp-print-note"]');
    expect(notes.length).toBe(2); // exactly the two noted sessions out of 130
    const noteTexts = notes.map((n) => n.text());
    expect(noteTexts.some((t) => t.includes(LONG_NOTE))).toBe(true); // full text, no truncation
    expect(noteTexts.some((t) => t.includes('Short closing note.'))).toBe(true);

    expect(w.find('[data-testid="shp-print-root"]').text()).not.toContain('Provider');
  });

  it('a narrowed range is passed straight to the endpoint', async () => {
    pagedMock(makeRangedSessions(10), 100);
    const w = mount(SessionHistoryPrintDialog, {
      props: { patient: summary(), visible: true },
      global: { stubs: { teleport: true } },
    });

    await w.find('[data-testid="shp-print-from"]').setValue('2026-02-01');
    await w.find('[data-testid="shp-print-to"]').setValue('2026-03-15');
    await w.find('[data-testid="shp-print-confirm"]').trigger('click');
    await flushPromises();

    expect(getPatientSessionsMock).toHaveBeenCalledWith(1, 1, 100, '2026-02-01', '2026-03-15');
    expect(w.find('[data-testid="shp-print-range"]').text()).toContain('from 02/01/2026 through 03/15/2026');
  });

  // ---- Addendum: summary/totals band over the FULL fetched set ----
  // Owed mirrors PatientSessionsTable's Paid/Owed cell verbatim: a paid-off session
  // contributes 0 (even with a stray amountDue), others contribute their server-computed
  // amountDue — nothing is re-derived from amount/discount client-side.

  it('foots the totals band over the whole multi-page set (discounted, partially-paid, and paid-off-with-stray-due sessions)', async () => {
    const all = makeRangedSessions(130); // 130 defaults: amount 45, paid 45, due 0, isPaidOff
    // day counter maps newest-first: all[i] has day = 130 - i → pick by sessionId (1000 + day)
    const byDay = (day: number) => all.find((s) => s.sessionId === 1000 + day)!;
    Object.assign(byDay(5), { amount: 75, discount: 10, amountPaid: 0, amountDue: 65, isPaidOff: false });
    Object.assign(byDay(6), { amount: 100, discount: 0, amountPaid: 40, amountDue: 60, isPaidOff: false });
    // Paid-off but with a stray non-zero amountDue — must NOT count toward Owed (isPaidOff gate).
    Object.assign(byDay(7), { amountDue: 5, isPaidOff: true });
    pagedMock(all, 100);

    const w = await confirmPrint();

    const band = w.find('[data-testid="shp-print-totals"]');
    expect(band.exists()).toBe(true);
    expect(w.find('[data-testid="shp-print-totals-count"]').text()).toBe('130');
    // 127 × $45 + $75 + $100 + $45 = $5,935.00 — includes page-2 rows, not just page 1
    expect(w.find('[data-testid="shp-print-totals-amount"]').text()).toBe('$5,935.00');
    expect(w.find('[data-testid="shp-print-totals-discount"]').text()).toBe('$10.00');
    // 127 × $45 + $0 + $40 + $45 = $5,800.00
    expect(w.find('[data-testid="shp-print-totals-paid"]').text()).toBe('$5,800.00');
    // $65 + $60 + $0 (stray due on a paid-off session excluded) = $125.00
    expect(w.find('[data-testid="shp-print-totals-owed"]').text()).toBe('$125.00');
    expect(band.text()).not.toContain('Provider');
  });

  it('totals band is null-safe over an empty in-range set (all zeros, no NaN)', async () => {
    pagedMock([], 100);
    const w = await confirmPrint();

    expect(w.find('[data-testid="shp-print-totals-count"]').text()).toBe('0');
    expect(w.find('[data-testid="shp-print-totals-amount"]').text()).toBe('$0.00');
    expect(w.find('[data-testid="shp-print-totals-discount"]').text()).toBe('$0.00');
    expect(w.find('[data-testid="shp-print-totals-paid"]').text()).toBe('$0.00');
    expect(w.find('[data-testid="shp-print-totals-owed"]').text()).toBe('$0.00');
    expect(w.find('[data-testid="shp-print-totals"]').text()).not.toContain('NaN');
  });

  it('shows a fetch error and keeps the dialog open when the export load fails', async () => {
    getPatientSessionsMock.mockRejectedValue(new Error('boom'));
    const w = await confirmPrint();

    expect(w.find('[data-testid="shp-print-fetch-error"]').exists()).toBe(true);
    expect(w.find('[data-testid="shp-print-dialog"]').exists()).toBe(true);
    expect(window.print).not.toHaveBeenCalled();
    expect(w.emitted('close')).toBeFalsy();
  });
});
