// composables/useClaims.ts
//
// Thin, template-friendly wrapper over the auth store's claim checks. Components use this for
// conditional rendering and behaviour, e.g.:
//
//   const { hasClaim } = useClaims();
//   <button v-if="hasClaim('Permission', Permissions.PatientsEdit)"> ... </button>
//
// Claims are loaded authoritatively from GET /api/auth/me as { type:'Permission', value:'<Area>.<Cap>' }
// (a SystemAdmin holds the System/FullAccess wildcard and satisfies every check). The granular
// RoleClaim catalogue for MGR/AM/FD is seeded by WP-17A; gate on the generated `Permissions`
// constants (below) so a typo'd or removed claim fails `vue-tsc` rather than silently never matching.

import { storeToRefs } from 'pinia';
import { useAuthStore } from '../stores/auth';

export { SYSTEM_CLAIM_TYPE, SYSTEM_FULL_ACCESS } from '../interfaces/Auth';
// Re-export the generated claim catalogue + manifest anchor so gates have one import site.
export { Permissions, ACCESS_CONTROL_MANIFEST_HASH } from '../generated/permissions';
export type { Permission } from '../generated/permissions';

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
