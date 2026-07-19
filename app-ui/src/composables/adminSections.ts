// composables/adminSections.ts
//
// WP-39C: /admin opened up from SYSADMIN-only to every Admin.View holder (MGR/AM/OWN), which
// means the Admin page's sections must each be gated on their own claim. This module is the
// single source for the per-lookup-table claim mapping so AdminAccordionNav (which section
// entries to show) and AdminView (which section to land on, which controls to render) can't
// drift apart.

import { Permissions, type Permission } from '../generated/permissions';

/** Coarse read claim per lookup table — controls section visibility. */
export const LOOKUP_VIEW_CLAIMS: Record<string, Permission> = {
  'appointment-statuses': Permissions.AdminLookupsAppointmentStatusView,
  'payment-types': Permissions.AdminLookupsPaymentTypeView,
  'role-types': Permissions.AdminLookupsRoleTypeView,
  'specialty-types': Permissions.AdminLookupsSpecialtyTypeView,
};

/** Structural manage claim per lookup table (SYSADMIN-only at the seeded roles) — controls Add/Edit. */
export const LOOKUP_MANAGE_CLAIMS: Record<string, Permission> = {
  'appointment-statuses': Permissions.AdminLookupsAppointmentStatusManage,
  'payment-types': Permissions.AdminLookupsPaymentTypeManage,
  'role-types': Permissions.AdminLookupsRoleTypeManage,
  'specialty-types': Permissions.AdminLookupsSpecialtyTypeManage,
};
