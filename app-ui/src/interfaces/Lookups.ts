// Lookup table interfaces for admin CRUD

export interface AppointmentStatusItem {
  appointmentStatusId: number;
  statusName: string;
  statusDescription: string | null;
}

export interface AppointmentStatusCreateRequest {
  statusName: string;
  statusDescription?: string;
}

export interface AppointmentStatusUpdateRequest {
  statusName?: string;
  statusDescription?: string;
}

export interface PaymentTypeItem {
  paymentTypeId: number;
  abbreviation: string;
  name: string;
}

export interface PaymentTypeCreateRequest {
  abbreviation: string;
  name: string;
}

export interface PaymentTypeUpdateRequest {
  abbreviation?: string;
  name?: string;
}

export interface RoleTypeItem {
  roleId: number;
  roleName: string;
}

export interface RoleTypeCreateRequest {
  roleName: string;
}

export interface RoleTypeUpdateRequest {
  roleName?: string;
}

export interface SpecialtyTypeItem {
  specialtyId: number;
  abbreviation: string;
  name: string;
}

export interface SpecialtyTypeCreateRequest {
  abbreviation: string;
  name: string;
}

export interface SpecialtyTypeUpdateRequest {
  abbreviation?: string;
  name?: string;
}
