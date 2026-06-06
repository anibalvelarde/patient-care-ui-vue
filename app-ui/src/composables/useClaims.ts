// composables/useClaims.ts
//
// Thin, template-friendly wrapper over the auth store's claim checks. Components use this for
// conditional rendering and behaviour, e.g.:
//
//   const { hasClaim, isSystemAdmin } = useClaims();
//   <button v-if="hasClaim('Permission', 'Patients.FullAccess')"> ... </button>
//
// NOTE (2026-06): only the SystemAdmin wildcard ('System','FullAccess') is seeded today; the
// granular RoleClaim catalogue (Patients.FullAccess, etc.) is deferred. Until it is seeded, the
// only live distinction is SA vs non-SA — but binding to specific claims now means views light up
// automatically once the catalogue lands, with no component changes.

import { storeToRefs } from 'pinia';
import { useAuthStore } from '../stores/auth';

export { SYSTEM_CLAIM_TYPE, SYSTEM_FULL_ACCESS } from '../interfaces/Auth';

export function useClaims() {
  const store = useAuthStore();
  const { isSystemAdmin, isAuthenticated, roles, fullName } = storeToRefs(store);

  return {
    isAuthenticated,
    isSystemAdmin,
    roles,
    fullName,
    hasClaim: store.hasClaim,
    hasAnyClaim: store.hasAnyClaim,
    hasAllClaims: store.hasAllClaims,
  };
}
