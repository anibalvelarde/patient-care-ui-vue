// WP-14.5 — ServicePaymentsList reverse action gating.
//
// The "Reverse" control is gated on ServicePayments.Adjust (MGR-only). It also must not appear on
// rows that are already reversed or that are themselves reversal entries. Claims are seeded straight
// from the manifest grants so the gate is tested against the real access-control matrix.

import { describe, it, expect } from 'vitest';
import { setActivePinia, createPinia, type Pinia } from 'pinia';
import { mount } from '@vue/test-utils';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import type { ServicePaymentRecord } from '../interfaces/ServicePayment';
import ServicePaymentsList from '../components/service-payments/ServicePaymentsList.vue';

type Role = 'MGR' | 'AM' | 'FD';

function claimsForRole(role: Role): ClaimDto[] {
  return (manifest.claims as Array<{ claim: string; grants: string[] }>)
    .filter((c) => c.grants.includes(role))
    .map((c) => ({ type: 'Permission', value: c.claim }));
}

function authAs(role: Role): Pinia {
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

function payment(overrides: Partial<ServicePaymentRecord> = {}): ServicePaymentRecord {
  return {
    servicePaymentId: 500,
    therapistId: 42,
    therapistName: 'Smith, Jane',
    paymentDate: '2026-04-20T00:00:00',
    amount: 120,
    paymentType: { paymentTypeId: 1, abbreviation: 'CHK', name: 'Check' },
    referenceNumber: 'CHK-1',
    notes: null,
    allocations: [{ sessionServicePaymentId: 1, sessionId: 1, sessionDate: '2026-04-05', patientName: 'Green, Dan', amountApplied: 120 }],
    totalApplied: 120,
    unallocatedAmount: 0,
    reversesServicePaymentId: null,
    isReversed: false,
    ...overrides,
  };
}

async function mountWith(role: Role, payments: ServicePaymentRecord[]) {
  const pinia = authAs(role);
  const w = mount(ServicePaymentsList, {
    props: { therapists: [{ therapistId: 42, therapistName: 'Smith, Jane' }] },
    global: { plugins: [pinia] },
  });
  // Drive the component into its loaded state without hitting the network.
  (w.vm as unknown as { payments: ServicePaymentRecord[] }).payments = payments;
  (w.vm as unknown as { loaded: boolean }).loaded = true;
  await w.vm.$nextTick();
  return w;
}

describe('ServicePaymentsList — Reverse action gating', () => {
  it('shows Reverse for MGR on a normal payment', async () => {
    const w = await mountWith('MGR', [payment()]);
    expect(w.text()).toContain('Reverse');
  });

  it('hides Reverse for AM (view-only, lacks ServicePayments.Adjust)', async () => {
    const w = await mountWith('AM', [payment()]);
    expect(w.text()).not.toContain('Reverse');
  });

  it('hides Reverse on an already-reversed original and badges it', async () => {
    const w = await mountWith('MGR', [payment({ isReversed: true })]);
    expect(w.text()).toContain('Reversed');
    expect(w.text()).not.toContain('Reverse payment'); // the action/modal verb
    expect(w.find('button.text-red-600').exists()).toBe(false);
  });

  it('hides Reverse on a reversal entry and labels it', async () => {
    const w = await mountWith('MGR', [payment({ servicePaymentId: 600, amount: -120, reversesServicePaymentId: 500 })]);
    expect(w.text()).toContain('Reversal of #500');
    expect(w.find('button.text-red-600').exists()).toBe(false);
  });
});
