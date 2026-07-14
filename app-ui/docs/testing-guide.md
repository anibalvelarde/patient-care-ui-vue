# UI Test-Authoring Guide

**Why this doc exists (intake 2026-07-13-001, item T1):** sessions kept re-reading old specs to
absorb the house style. This is that style, written down. Read this INSTEAD of browsing specs.

**Definition of Done:** when you invent a new test pattern (or hit a new harness gotcha), add it
here in the same PR. This guide is authoritative — if a spec and this guide disagree, fix one.

## The basics

- Framework: **vitest** (jsdom, globals on) + `@vue/test-utils`. Config: `app-ui/vitest.config.ts`
  merges the app's `vite.config.ts`, so the `@` alias and `__APP_*__` defines resolve identically.
- Specs live in **`app-ui/src/__tests__/*.spec.ts`**. There are **no `setupFiles` and no shared
  test helpers** — every spec is self-contained and copy-pastes the patterns below (deliberate:
  each spec reads standalone).
- Run: `npm test` (one-shot `vitest run`) · `npm run test:watch`. Full local gate:
  `npx vue-tsc --noEmit && npm run lint && npx vitest run`.
- Two artifact kinds, don't confuse them: `src/__tests__/*.spec.ts` = unit/component specs (this
  guide); `test-scenarios/*.md` (repo root + `app-ui/test-scenarios/`) = **user-facing walkthrough
  docs** the owner runs in a browser — every new/modified UI feature ships one (see `../CLAUDE.md`).

## Canonical spec skeleton

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia, type Pinia } from 'pinia';
import manifest from '../generated/access-control-matrix.json';
import { useAuthStore } from '../stores/auth';
import MyComponent from '../components/somewhere/MyComponent.vue';

// 1. hoisted mocks (see below)
// 2. vi.mock every HttpClient the component (and its children) new up
// 3. claimsForRole/authAs helpers (copy verbatim, below)
// 4. local factories (patient(), caretaker(), … with Partial<T> overrides)

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getThingsMock.mockResolvedValue([thing()]); // re-seed defaults after clearing
  });

  it('does the thing', async () => {
    const wrapper = mount(MyComponent, {
      props: { visible: false },
      global: { plugins: [authAs('MGR')], stubs: { teleport: true } },
    });
    await wrapper.setProps({ visible: true });
    await flushPromises();
    expect(wrapper.find('[data-testid="my-thing"]').exists()).toBe(true);
  });
});
```

## Auth & claims — manifest-driven `authAs`, never hand-written claims

Claims come from the **generated** matrix (`src/generated/access-control-matrix.json`) so specs
stay true to the real grants and survive matrix reseeds. Copy verbatim:

```ts
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
    userId: 1, email: 'test@example.com', fullName: 'Test User',
    mustChangePassword: false, roles: [role], claims: claimsForRole(role),
    isSystemAdmin: false,
  };
  return pinia;
}
```

- Role codes: `FD`, `MGR`, `AM`, `OWN`, `ACCT`; SYSADMIN = `isSystemAdmin: true` (no role claims
  needed — wildcard).
- Pass the returned pinia into mount: `global: { plugins: [authAs('FD')] }`.
- Claim-gating assertions: mount the same component as two roles and assert the gated control
  exists/doesn't (see `wp24-requires-discovery.spec.ts`, `claim-gating.spec.ts`).
- Permission constants come from `src/generated/permissions.ts` — import `Permissions`, never
  string-literal a claim name.

## HTTP clients — `vi.hoisted` mock-per-client recipe

`vi.mock` factories are hoisted above imports, so the mock fns they close over must be created
with `vi.hoisted`. One mock constant per client method; each `*HttpClient` class is mocked as a
constructor returning an object of those fns:

```ts
const { getCaretakersMock, createCaretakerMock, linkPatientMock } = vi.hoisted(() => ({
  getCaretakersMock: vi.fn(),
  createCaretakerMock: vi.fn(),
  linkPatientMock: vi.fn(),
}));

vi.mock('../services/CaretakersHttpClient', () => ({
  CaretakersHttpClient: vi.fn().mockImplementation(() => ({
    getCaretakers: getCaretakersMock,
    createCaretaker: createCaretakerMock,
    linkPatient: linkPatientMock,
  })),
}));
```

Rules:
- **Mock EVERY client the component (or any child it renders) news up** — an unmocked client
  constructor hits `HttpClientBase`/`authBridge` and fails cryptically. When a modal embeds other
  forms, count their clients too (`wp24` mocks Patients + Therapists + Lookup + Sessions).
- Re-seed default `mockResolvedValue`s in `beforeEach` **after** `vi.clearAllMocks()` — clearing
  wipes the seeds.
- Grouping variant when one client has many methods: a single hoisted
  `patientsClientMocks: { getPatients: vi.fn(), … }` object works too (`wp24` style).

## Modals & teleport — stub it, and know the gotcha

- Mount modals with `global: { stubs: { teleport: true } }`, start `visible: false`, then
  `await wrapper.setProps({ visible: true })`.
- ⚠️ **Teleport-stub gotcha (2026-07-13, `wp27-cross-add-flows.spec.ts`):** the stub **recreates
  slot children on re-render, silently resetting their local state** (e.g. a form selection after
  a failed submit). That reset is a **stub artifact, not an app bug** — it was verified against a
  real unstubbed teleport that state survives. In specs, re-select before retrying and leave a
  comment saying why. If you see "state mysteriously reset" in a modal spec, suspect the stub
  before the component.

## Selectors — `data-testid`, kebab-case, feature-prefixed

- Add `data-testid` to anything a spec targets; select with
  `wrapper.find('[data-testid="…"]')`. Never select by Tailwind classes or visible text
  (both churn).
- Naming: kebab-case with a feature prefix — `chain-context-banner`, `chain-retry-link`,
  `link-entity-select`, `requires-discovery-checkbox`, `nav-merge-patients`.

## Async rhythm — `flushPromises` vs `vi.waitFor`

- `await flushPromises()` after any mount/`setProps`/`trigger` that kicks off fetches — drains
  `onMounted` chains and awaited handlers.
- `await vi.waitFor(() => expect(createPatientMock).toHaveBeenCalled())` when asserting a submit
  handler's async side effects (emit ordering, chained calls) — polling beats guessing tick counts.
- `await nextTick()` for pure re-renders with no promises in flight.
- Drive forms via `wrapper.find('form').trigger('submit')`. Poking VM internals
  (`(wrapper.vm as unknown as SomeVm).form.patientId = 5`) is accepted where a field has no
  simple input handle (see `wp23-booking-money.spec.ts`) — keep the cast typed via a local
  interface, not `any`.

## Test data — local factories with `Partial<T>` overrides

```ts
function patient(overrides: Partial<Patient> = {}): Patient {
  return { patientId: 1, patientName: 'Test Patient', medicalRecordNumber: 'L26-0001',
    isActive: true, requiresDiscovery: true, caretakers: [], ...overrides } as Patient;
}
```

- One factory per entity, defaults valid, override only what the test cares about.
- Form-fill helpers are local per spec and index positional inputs (first `input[type="email"]`,
  `findAll('input[type="text"]')[0]`, first `select` = gender, …) — if you add a field to a form,
  check the positional helpers in its specs.
- Wrap repetitive mount ceremonies in local helpers (`openModal(...)`, `openChain(...)`).

## Load-bearing infrastructure a spec must account for

- `src/generated/access-control-matrix.json` + `src/generated/permissions.ts` — the claims
  manifest and `Permissions` catalogue (+ `ACCESS_CONTROL_MANIFEST_HASH`). Regenerated, never
  hand-edited.
- `src/services/authBridge.ts` — store↔client indirection; real callbacks are registered in
  `main.ts`, which specs don't run. Components relying on 401/403 side effects need those
  behaviors asserted via mocks, not the bridge.
- Composables `useClaims`, `useFormError`, `useModalForm`, `useLookupCrud` — mount with a real
  pinia (`authAs`) so `useClaims` works; don't mock these.
- Router: most component specs don't install a router — components using `useRouter` need
  `vi.mock('vue-router', …)` or a real router instance (see `router-guard.spec.ts`,
  `login-view.spec.ts`).

## Known gotchas (append as discovered)

| Date | Gotcha | Spec that documents it |
|------|--------|------------------------|
| 2026-07-13 | Teleport STUB remounts slot children on re-render → local state resets are a stub artifact, not an app bug | `wp27-cross-add-flows.spec.ts` |
| 2026-07-12 | `vi.clearAllMocks()` in `beforeEach` wipes `mockResolvedValue` seeds — re-seed after clearing | (pattern in `wp23`/`wp24` specs) |
