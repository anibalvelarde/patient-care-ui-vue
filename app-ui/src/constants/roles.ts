// WP-56C — identity role names, LOWER-CASE because every UI comparison is case-insensitive
// (`name.trim().toLowerCase()`). Mirrors the API's `RoleTaxonomy.IdentityRoleNames`
// ("Patient", "Therapist", "Caretaker" — compared OrdinalIgnoreCase there). Identity roles are
// workflow-managed and never assignable in Admin → Users. Roles are otherwise lookup-driven;
// SystemAdmin is a flag, not a role string (plan §G).

export const IDENTITY_ROLE_NAMES: readonly string[] = ['patient', 'therapist', 'caretaker'];

export function isIdentityRoleName(roleName: string): boolean {
  return IDENTITY_ROLE_NAMES.includes(roleName.trim().toLowerCase());
}
