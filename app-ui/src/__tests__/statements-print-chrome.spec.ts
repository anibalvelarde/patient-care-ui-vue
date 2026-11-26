// Statements print: the app chrome (header + mobile nav) must be hidden when a statement prints.
//
// Bug: StatementView put class="print:hidden" directly on <O2Header> / <O2MobileNav>, but both
// components render TWO root elements (a fragment), so Vue cannot inherit the class — it is
// dropped (with an "Extraneous non-props attributes" warning) and the header printed on every
// statement. Found by the local browser-console walk; reproduced under print media in Chrome.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia, type Pinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { useAuthStore } from '../stores/auth';
import StatementView from '../views/StatementView.vue';

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/statements', query: {} }),
  useRouter: () => ({ push: vi.fn() }),
}));

// Any client method the view calls on mount resolves to an empty list.
const { emptyClient } = vi.hoisted(() => ({
  emptyClient: () =>
    new Proxy({}, { get: (_t, prop) => (prop === 'then' ? undefined : vi.fn().mockResolvedValue([])) }),
}));
vi.mock('../services/CaretakersHttpClient', () => ({ CaretakersHttpClient: vi.fn().mockImplementation(emptyClient) }));
vi.mock('../services/TherapistsHttpClient', () => ({ TherapistsHttpClient: vi.fn().mockImplementation(emptyClient) }));
vi.mock('../services/StatementsHttpClient', () => ({ StatementsHttpClient: vi.fn().mockImplementation(emptyClient) }));

function authAsSysAdmin(): Pinia {
  const pinia = createPinia();
  setActivePinia(pinia);
  useAuthStore().user = {
    userId: 1, email: 'test@example.com', fullName: 'Test User',
    mustChangePassword: false, roles: [], claims: [], isSystemAdmin: true,
  };
  return pinia;
}

function mountView() {
  return mount(StatementView, {
    global: {
      plugins: [authAsSysAdmin()],
      // Real O2Header / O2MobileNav (the multi-root components under test); everything else stubbed.
      stubs: {
        O2Sidebar: true, O2Footer: true, RouterLink: true,
        CaretakerStatementControls: true, CaretakerStatementScreen: true,
        TherapistStatementControls: true, TherapistStatementScreen: true,
      },
    },
  });
}

describe('StatementView — app chrome is hidden in print', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => { warn = vi.spyOn(console, 'warn').mockImplementation(() => {}); });
  afterEach(() => { warn.mockRestore(); });

  it('puts every O2Header root element inside a print:hidden container', () => {
    const w = mountView();
    const header = w.find('header').element;
    const headerSecondRoot = header.nextElementSibling as HTMLElement;
    expect(header.closest('.print\\:hidden')).not.toBeNull();
    expect(headerSecondRoot.closest('.print\\:hidden')).not.toBeNull();
  });

  it('puts the O2MobileNav root inside a print:hidden container', () => {
    const w = mountView();
    const mobileBar = w.find('div.bg-violet-900').element;
    expect(mobileBar.closest('.print\\:hidden')).not.toBeNull();
  });

  it('renders without the "Extraneous non-props attributes" Vue warning', () => {
    mountView();
    const extraneous = warn.mock.calls.filter((c) => String(c[0]).includes('Extraneous non-props attributes'));
    expect(extraneous).toHaveLength(0);
  });
});
