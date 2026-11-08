// WP-56C — magic strings/values → src/constants/ (UI sibling of the WP-55B API pass).
//
//   G2/G6 lockstep: every API-mirrored constant home must equal the vendored API fixture
//          (fixtures/api-constants.json). Change one side without the other → this spec fails.
//          Same idea as permissions.spec.ts guarding the generated access-control catalogue.
//   G4    : the manual relationship pickers offer Legal-Guardian and never Self.
//   G3    : the status presentation folded out of utils/statusHelpers.ts is pinned value-for-value
//          (behaviour-preserving), and the plan-progress palette stays deliberately separate.

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import fixture from './fixtures/api-constants.json';
import {
  SessionStatus, SessionStatusName, SESSION_STATUS_ID_TO_NAME,
  CONFIRMED_STATUSES, ACTIVE_STATUSES, TERMINAL_STATUSES, NOT_HELD_STATUSES,
  isNotHeld, isTerminalStatus, getStatusBadgeClass, getStatusDotColor, getStatusLabel,
  getPlanProgressStatusClass, APPOINTMENT_FILTER_NOT_HELD,
} from '../constants/sessionStatus';
import {
  CaretakerRelationship, ALL_CARETAKER_RELATIONSHIPS, RELATIONSHIP_DROPDOWN_OPTIONS, isSelfRelationship,
} from '../constants/caretakerRelationships';
import { ALL_GENDERS } from '../constants/genders';
import { ALL_CONFIRMATION_RESULTS, ALL_CONFIRMATION_METHODS } from '../constants/confirmationValues';
import { BOOKABLE_DURATIONS, PRICED_DURATIONS } from '../constants/durations';
import { IDENTITY_ROLE_NAMES, isIdentityRoleName } from '../constants/roles';
import { PLAN_STATUS_TABS, ALL_PLAN_STATUSES } from '../constants/planStatus';
import CaretakerLinkForm from '../components/shared/CaretakerLinkForm.vue';

const sorted = (xs: readonly number[]) => [...xs].sort((a, b) => a - b);

describe('WP-56 G2 — constant homes are in lockstep with the vendored API values', () => {
  it('session status id↔name map matches the API SessionStatus', () => {
    const expected = Object.fromEntries(
      Object.entries(fixture.sessionStatus.idToName).map(([id, name]) => [Number(id), name]),
    );
    expect(SESSION_STATUS_ID_TO_NAME).toEqual(expected);
    // the id and name objects agree key-for-key with that map
    for (const key of Object.keys(SessionStatus) as (keyof typeof SessionStatus)[]) {
      expect(SESSION_STATUS_ID_TO_NAME[SessionStatus[key]]).toBe(SessionStatusName[key]);
    }
  });

  it('confirmed/active status sets match the API', () => {
    expect(sorted(CONFIRMED_STATUSES)).toEqual(fixture.sessionStatus.confirmedStatuses);
    expect(sorted(ACTIVE_STATUSES)).toEqual(fixture.sessionStatus.activeStatuses);
  });

  it('relationship, gender and confirmation value lists match the API (order included)', () => {
    expect([...ALL_CARETAKER_RELATIONSHIPS]).toEqual(fixture.caretakerRelationships.all);
    expect([...ALL_GENDERS]).toEqual(fixture.genders.all);
    expect([...ALL_CONFIRMATION_RESULTS]).toEqual(fixture.confirmationValues.allResults);
    expect([...ALL_CONFIRMATION_METHODS]).toEqual(fixture.confirmationValues.allMethods);
  });

  it('bookable and priced durations both match the API AllowedDurations — and never contain 40', () => {
    expect([...BOOKABLE_DURATIONS]).toEqual(fixture.durations.allowed);
    expect([...PRICED_DURATIONS]).toEqual(fixture.durations.allowed);
    expect(BOOKABLE_DURATIONS).not.toContain(40);
  });

  it('identity role names match the API RoleTaxonomy (case-insensitively)', () => {
    expect([...IDENTITY_ROLE_NAMES]).toEqual(fixture.roles.identityRoleNames.map(r => r.toLowerCase()));
    expect(isIdentityRoleName('  Therapist ')).toBe(true);
    expect(isIdentityRoleName('Manager')).toBe(false);
  });
});

describe('WP-56 G4 — manual relationship pickers', () => {
  it('dropdown options = every relationship except Self, with Legal-Guardian included', () => {
    const values = RELATIONSHIP_DROPDOWN_OPTIONS.map(o => o.value);
    expect(values).toEqual(['Father', 'Mother', 'Relative', 'HiredHelp', 'Legal-Guardian']);
    expect(values).not.toContain(CaretakerRelationship.Self);
  });

  it('CaretakerLinkForm renders None + the five manual options, labelled for humans', () => {
    const wrapper = mount(CaretakerLinkForm, {
      props: { entityLabel: 'Caretaker', fetchOptions: async () => [] },
    });
    const options = wrapper.find('[data-testid="link-relationship-select"]').findAll('option');
    expect(options.map(o => o.text())).toEqual(
      ['None', 'Father', 'Mother', 'Relative', 'Hired Help', 'Legal Guardian'],
    );
    expect(options.map(o => o.attributes('value'))).not.toContain('Self');
    // the wire value stays the API's hyphenated enum value
    expect(options[5].element.value).toBe('Legal-Guardian');
  });

  it('isSelfRelationship is case-insensitive and null-safe (unlink/remove gate)', () => {
    expect(isSelfRelationship('Self')).toBe(true);
    expect(isSelfRelationship('self')).toBe(true);
    expect(isSelfRelationship('Mother')).toBe(false);
    expect(isSelfRelationship(null)).toBe(false);
    expect(isSelfRelationship(undefined)).toBe(false);
  });
});

describe('WP-56 G3 — status presentation folded from statusHelpers.ts, value-for-value', () => {
  it('badge classes, dot colours and labels are unchanged for all seven statuses', () => {
    const expected: Record<number, [string, string]> = {
      1: ['bg-amber-100 text-amber-800', 'bg-amber-400'],
      2: ['bg-green-100 text-green-800', 'bg-green-400'],
      3: ['bg-slate-100 text-slate-600', 'bg-slate-400'],
      4: ['bg-gray-100 text-gray-600', 'bg-gray-400'],
      5: ['bg-red-100 text-red-800', 'bg-red-400'],
      6: ['bg-blue-100 text-blue-800', 'bg-blue-400'],
      7: ['bg-purple-100 text-purple-800', 'bg-purple-400'],
    };
    for (const [id, [badge, dot]] of Object.entries(expected)) {
      expect(getStatusBadgeClass(Number(id))).toBe(badge);
      expect(getStatusDotColor(Number(id))).toBe(dot);
    }
    expect(getStatusLabel('NoShow')).toBe('No Show');
    expect(getStatusLabel('CheckedIn')).toBe('Checked In');
    expect(getStatusLabel('InTherapy')).toBe('In Therapy');
  });

  it('unknown ids/names fall back exactly as before (admin-added lookup statuses)', () => {
    expect(getStatusBadgeClass(99)).toBe('bg-gray-100 text-gray-800');
    expect(getStatusDotColor(99)).toBe('bg-gray-400');
    expect(getStatusLabel('Rescheduled')).toBe('Rescheduled');
  });

  it('plan-progress palette stays separate (Proposed is blue there, amber in badges)', () => {
    expect(getPlanProgressStatusClass(SessionStatus.Proposed)).toBe('text-blue-600');
    expect(getPlanProgressStatusClass(SessionStatus.Confirmed)).toBe('text-emerald-600');
    expect(getPlanProgressStatusClass(SessionStatus.Cancelled)).toBe('text-red-500');
    expect(getPlanProgressStatusClass(SessionStatus.Completed)).toBe('text-gray-600');
    expect(getPlanProgressStatusClass(SessionStatus.NoShow)).toBe('text-slate-500');
  });
});

describe('WP-56 risk register — status groupings that drive counts and guards', () => {
  it('NOT_HELD = Cancelled + NoShow (dashboard payable/cancelled buckets, list filter)', () => {
    expect(sorted(NOT_HELD_STATUSES)).toEqual([3, 5]);
    expect([1, 2, 3, 4, 5, 6, 7].filter(isNotHeld)).toEqual([3, 5]);
  });

  it('TERMINAL = Cancelled + Completed + NoShow (no further transitions offered)', () => {
    expect(sorted(TERMINAL_STATUSES)).toEqual([3, 4, 5]);
    expect([1, 2, 3, 4, 5, 6, 7].filter(isTerminalStatus)).toEqual([3, 4, 5]);
  });

  it('the cross-component NOT_HELD filter token stays "cancelled" (linked/bookmarked URLs)', () => {
    expect(APPOINTMENT_FILTER_NOT_HELD).toBe('cancelled');
  });

  it('plan-status tabs are All + every status, in display order', () => {
    expect([...PLAN_STATUS_TABS]).toEqual(['All', 'Draft', 'Active', 'Completed', 'Cancelled']);
    expect(ALL_PLAN_STATUSES).toHaveLength(4);
  });
});
