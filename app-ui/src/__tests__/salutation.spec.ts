import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia, type Pinia } from 'pinia';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import type { ClaimDto } from '../interfaces/Auth';
import O2Header from '../components/option02/O2Header.vue';

// O2Header calls useRouter() for logout/quick-actions — no real router in component specs.
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function claimsForRole(role: string): ClaimDto[] {
  return (manifest.claims as Array<{ claim: string; grants: string[] }>)
    .filter((c) => c.grants.includes(role))
    .map((c) => ({ type: 'Permission', value: c.claim }));
}

// WP-33 variant of the canonical authAs: fullName, roles (plural), and isSystemAdmin are the
// inputs under test, so they're parameters here.
function authWith(options: {
  fullName?: string;
  roles?: string[];
  isSystemAdmin?: boolean;
}): Pinia {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useAuthStore();
  store.user = {
    userId: 1,
    email: 'test@example.com',
    fullName: options.fullName ?? 'Velarde, Anibal',
    mustChangePassword: false,
    roles: options.roles ?? ['FD'],
    claims: (options.roles ?? ['FD']).flatMap(claimsForRole),
    isSystemAdmin: options.isSystemAdmin ?? false,
  };
  return pinia;
}

function mountHeader(options: Parameters<typeof authWith>[0]) {
  return mount(O2Header, { global: { plugins: [authWith(options)] } });
}

function salutationName(wrapper: ReturnType<typeof mountHeader>) {
  return wrapper.find('[data-testid="salutation-name"]').text();
}

function salutationRole(wrapper: ReturnType<typeof mountHeader>) {
  return wrapper.find('[data-testid="salutation-role"]').text();
}

describe('O2Header salutation (WP-33)', () => {
  // ── first name parse: auth.fullName is "LastName, FirstName Middle" ──────────
  it('greets with the token after the comma', () => {
    const wrapper = mountHeader({ fullName: 'Velarde, Anibal' });
    expect(salutationName(wrapper)).toBe('Anibal');
  });

  it('drops a middle name from the greeting', () => {
    const wrapper = mountHeader({ fullName: 'Gomez, Ana Maria' });
    expect(salutationName(wrapper)).toBe('Ana');
  });

  it('falls back to the first token when there is no comma', () => {
    const wrapper = mountHeader({ fullName: 'Anibal Velarde' });
    expect(salutationName(wrapper)).toBe('Anibal');
  });

  it('never renders an empty greeting name', () => {
    const wrapper = mountHeader({ fullName: '' });
    expect(salutationName(wrapper)).toBe('there');
  });

  // ── role label: highest role, fixed precedence, standard labels ──────────────
  it('shows Front Desk for an FD user, before the date', () => {
    const wrapper = mountHeader({ roles: ['FD'] });
    expect(salutationRole(wrapper)).toBe('Front Desk');
    expect(wrapper.find('p.text-xs').text()).toMatch(/^Front Desk · /);
  });

  it('shows only the highest role for a multi-role user (MGR outranks FD)', () => {
    const wrapper = mountHeader({ roles: ['FD', 'MGR'] });
    expect(salutationRole(wrapper)).toBe('Manager');
  });

  it('OWN outranks MGR', () => {
    const wrapper = mountHeader({ roles: ['MGR', 'OWN'] });
    expect(salutationRole(wrapper)).toBe('Owner');
  });

  it.each([
    ['AM', 'Assistant Manager'],
    ['ACCT', 'Accountant'],
  ])('labels %s as %s', (role, label) => {
    const wrapper = mountHeader({ roles: [role] });
    expect(salutationRole(wrapper)).toBe(label);
  });

  it('System Administrator outranks everything, even with roles present', () => {
    const wrapper = mountHeader({ roles: ['OWN', 'MGR'], isSystemAdmin: true });
    expect(salutationRole(wrapper)).toBe('System Administrator');
  });

  it('shows a raw unknown role code rather than blank', () => {
    const wrapper = mountHeader({ roles: ['XYZ'] });
    expect(salutationRole(wrapper)).toBe('XYZ');
  });

  it('omits the role segment (and separator) entirely when there is no role at all', () => {
    const wrapper = mountHeader({ roles: [] });
    expect(wrapper.find('[data-testid="salutation-role"]').exists()).toBe(false);
    expect(wrapper.find('p.text-xs').text()).not.toContain('·');
  });
});
