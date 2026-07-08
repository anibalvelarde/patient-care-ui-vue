// WP-20 — payroll "paid in range" visibility.
//
// PayTherapistWizard shows a muted disclosure line under the Unpaid Sessions header when the
// unpaid-sessions envelope reports prior payments in the range, expandable (chevron) into a
// read-only paid-sessions table. RunPayrollWizard shows a "N paid · $X" sub-line under each
// therapist name when paidSessionCount > 0. Components are driven via internal refs (no HTTP).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia, type Pinia } from 'pinia';
import { mount, type VueWrapper } from '@vue/test-utils';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import type {
  PaidInRangeSummary,
  PaidProviderSessionDetail,
  PayrollPreviewTherapist,
  UnpaidProviderSessionSummary,
} from '../interfaces/ServicePayment';
import { ServicePaymentsHttpClient } from '../services/ServicePaymentsHttpClient';
import PayTherapistWizard from '../components/service-payments/PayTherapistWizard.vue';
import RunPayrollWizard from '../components/service-payments/RunPayrollWizard.vue';

function claimsForRole(role: string): ClaimDto[] {
  return (manifest.claims as Array<{ claim: string; grants: string[] }>)
    .filter((c) => c.grants.includes(role))
    .map((c) => ({ type: 'Permission', value: c.claim }));
}

function authAsMgr(): Pinia {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useAuthStore();
  store.user = {
    userId: 1,
    email: 'test@example.com',
    fullName: 'Test User',
    mustChangePassword: false,
    roles: ['MGR'],
    claims: claimsForRole('MGR'),
    isSystemAdmin: false,
  };
  return pinia;
}

function unpaidSession(overrides: Partial<UnpaidProviderSessionSummary> = {}): UnpaidProviderSessionSummary {
  return {
    sessionId: 10,
    sessionDate: '2026-06-02',
    sessionTime: '09:00',
    patientId: 5,
    patientName: 'Green, Dan',
    therapyType: 'TO/IS',
    providerAmount: 20,
    alreadyApplied: 0,
    remainingProviderAmount: 20,
    ...overrides,
  };
}

function paidDetail(overrides: Partial<PaidProviderSessionDetail> = {}): PaidProviderSessionDetail {
  return {
    sessionId: 90,
    sessionDate: '2026-05-30',
    sessionTime: '10:00',
    patientName: 'Rivera, Ana',
    therapyType: 'TO/IS',
    providerAmount: 21.25,
    amountApplied: 21.25,
    remainingProviderAmount: 0,
    paymentReferences: [
      { servicePaymentId: 88, referenceNumber: 'PAYROLL-2026-05', paymentDate: '2026-05-31', amountApplied: 21.25 },
    ],
    ...overrides,
  };
}

function paidInRange(overrides: Partial<PaidInRangeSummary> = {}): PaidInRangeSummary {
  return {
    fullyPaidSessionCount: 4,
    fullyPaidTotal: 85,
    totalApplied: 85,
    sessions: [paidDetail()],
    ...overrides,
  };
}

const PAY_WIZARD_PROPS = {
  therapists: [{ therapistId: 23, therapistName: 'ANNELYS' }],
  paymentTypes: [{ paymentTypeId: 1, abbreviation: 'ACH', name: 'Bank Transfer' }],
};

async function mountPayWizard(paid: PaidInRangeSummary | null, sessions: UnpaidProviderSessionSummary[] = [unpaidSession()]) {
  const pinia = authAsMgr();
  const w = mount(PayTherapistWizard, {
    props: PAY_WIZARD_PROPS,
    global: { plugins: [pinia] },
  });
  // Drive the component into its loaded state without hitting the network.
  const vm = w.vm as unknown as {
    sessions: UnpaidProviderSessionSummary[]
    paidInRange: PaidInRangeSummary | null
    loaded: boolean
  };
  vm.sessions = sessions;
  vm.paidInRange = paid;
  vm.loaded = true;
  await w.vm.$nextTick();
  return w;
}

function disclosureButton(w: VueWrapper) {
  return w.findAll('button').find((b) => b.text().includes('already paid'));
}

beforeEach(() => {
  // Neutralize the onMounted quincena-default helper so no real network call is attempted.
  vi.spyOn(ServicePaymentsHttpClient.prototype, 'getQuincena')
    .mockResolvedValue({ from: '2026-05-30', to: '2026-06-12' });
});

describe('PayTherapistWizard — paid-in-range disclosure', () => {
  it('is hidden when paidInRange is null', async () => {
    const w = await mountPayWizard(null);
    expect(w.text()).not.toContain('already paid');
  });

  it('is hidden when totalApplied is 0', async () => {
    const w = await mountPayWizard(paidInRange({ fullyPaidSessionCount: 0, fullyPaidTotal: 0, totalApplied: 0, sessions: [] }));
    expect(w.text()).not.toContain('already paid');
  });

  it('renders count and formatted total (plural)', async () => {
    const w = await mountPayWizard(paidInRange());
    expect(w.text()).toContain('4 sessions ($85.00) in this range were already paid');
    expect(w.text()).not.toContain('incl.');
  });

  it('uses singular phrasing for one session', async () => {
    const w = await mountPayWizard(paidInRange({ fullyPaidSessionCount: 1, fullyPaidTotal: 21.25, totalApplied: 21.25 }));
    expect(w.text()).toContain('1 session ($21.25) in this range was already paid');
  });

  it('appends the partial-applied suffix when fullyPaidTotal !== totalApplied', async () => {
    const w = await mountPayWizard(paidInRange({ fullyPaidTotal: 85, totalApplied: 97.5 }));
    expect(w.text()).toContain(
      '4 sessions ($85.00) in this range were already paid (incl. $12.50 applied on partially-paid sessions shown above)',
    );
  });

  it('chevron expand reveals the paid table with reference and Partial badge', async () => {
    const partial = paidDetail({
      sessionId: 91,
      patientName: 'Solis, Mia',
      amountApplied: 10,
      remainingProviderAmount: 11.25,
      paymentReferences: [{ servicePaymentId: 88, referenceNumber: '', paymentDate: '2026-05-31', amountApplied: 10 }],
    });
    const w = await mountPayWizard(paidInRange({ totalApplied: 95, sessions: [paidDetail(), partial] }));

    // Collapsed by default — no detail rows yet.
    expect(w.text()).not.toContain('Rivera, Ana');

    const btn = disclosureButton(w);
    expect(btn).toBeTruthy();
    expect(btn!.find('svg').classes()).not.toContain('rotate-90');
    await btn!.trigger('click');

    expect(btn!.find('svg').classes()).toContain('rotate-90');
    expect(w.text()).toContain('Rivera, Ana');
    expect(w.text()).toContain('PAYROLL-2026-05 ($21.25)');  // named reference
    expect(w.text()).toContain('#88 ($10.00)');              // blank reference falls back to payment id
    expect(w.text()).toContain('Full');
    expect(w.text()).toContain('Partial');
    // Read-only: the paid table adds no checkboxes beyond the payable rows' own.
    expect(w.findAll('input[type="checkbox"]').length).toBe(1);
  });

  it('collapses again on a second click', async () => {
    const w = await mountPayWizard(paidInRange());
    const btn = disclosureButton(w);
    await btn!.trigger('click');
    expect(w.text()).toContain('Rivera, Ana');
    await btn!.trigger('click');
    expect(w.text()).not.toContain('Rivera, Ana');
  });
});

describe('RunPayrollWizard — paid-in-range sub-line', () => {
  function therapistRow(overrides: Partial<PayrollPreviewTherapist> = {}): PayrollPreviewTherapist {
    return {
      therapistId: 23,
      therapistName: 'ANNELYS',
      sessionCount: 16,
      totalRemaining: 363.4,
      paidSessionCount: 0,
      paidTotal: 0,
      sessions: [],
      ...overrides,
    };
  }

  async function mountRunWizard(preview: PayrollPreviewTherapist[]) {
    const pinia = authAsMgr();
    const w = mount(RunPayrollWizard, {
      props: { paymentTypes: PAY_WIZARD_PROPS.paymentTypes },
      global: { plugins: [pinia] },
    });
    const vm = w.vm as unknown as { preview: PayrollPreviewTherapist[]; loaded: boolean };
    vm.preview = preview;
    vm.loaded = true;
    await w.vm.$nextTick();
    return w;
  }

  it('renders the sub-line when paidSessionCount > 0', async () => {
    const w = await mountRunWizard([therapistRow({ paidSessionCount: 4, paidTotal: 85 })]);
    expect(w.text()).toMatch(/4 paid\s*·\s*\$85\.00/);
  });

  it('renders no sub-line when paidSessionCount is 0', async () => {
    const w = await mountRunWizard([therapistRow()]);
    expect(w.text()).not.toContain('paid ·');
    expect(w.text()).toContain('ANNELYS');
  });
});
