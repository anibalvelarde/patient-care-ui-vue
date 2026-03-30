import { HttpClientBase } from './HttpClientBase';
import type {
  AppointmentStatusItem, AppointmentStatusCreateRequest, AppointmentStatusUpdateRequest,
  PaymentTypeItem, PaymentTypeCreateRequest, PaymentTypeUpdateRequest,
  RoleTypeItem, RoleTypeCreateRequest, RoleTypeUpdateRequest,
  SpecialtyTypeItem, SpecialtyTypeCreateRequest, SpecialtyTypeUpdateRequest,
} from '../interfaces/Lookups';

export class LookupHttpClient extends HttpClientBase {
  // Appointment Statuses
  async getAppointmentStatuses(): Promise<AppointmentStatusItem[]> {
    return this.get<AppointmentStatusItem[]>('/api/appointment-statuses');
  }
  async createAppointmentStatus(data: AppointmentStatusCreateRequest): Promise<AppointmentStatusItem> {
    return this.post<AppointmentStatusItem>('/api/appointment-statuses', data);
  }
  async updateAppointmentStatus(id: number, data: AppointmentStatusUpdateRequest): Promise<void> {
    return this.put(`/api/appointment-statuses/${id}`, data);
  }

  // Payment Types
  async getPaymentTypes(): Promise<PaymentTypeItem[]> {
    return this.get<PaymentTypeItem[]>('/api/payment-types');
  }
  async createPaymentType(data: PaymentTypeCreateRequest): Promise<PaymentTypeItem> {
    return this.post<PaymentTypeItem>('/api/payment-types', data);
  }
  async updatePaymentType(id: number, data: PaymentTypeUpdateRequest): Promise<void> {
    return this.put(`/api/payment-types/${id}`, data);
  }

  // Role Types
  async getRoleTypes(): Promise<RoleTypeItem[]> {
    return this.get<RoleTypeItem[]>('/api/role-types');
  }
  async createRoleType(data: RoleTypeCreateRequest): Promise<RoleTypeItem> {
    return this.post<RoleTypeItem>('/api/role-types', data);
  }
  async updateRoleType(id: number, data: RoleTypeUpdateRequest): Promise<void> {
    return this.put(`/api/role-types/${id}`, data);
  }

  // Specialty Types
  async getSpecialtyTypes(): Promise<SpecialtyTypeItem[]> {
    return this.get<SpecialtyTypeItem[]>('/api/specialty-types');
  }
  async createSpecialtyType(data: SpecialtyTypeCreateRequest): Promise<SpecialtyTypeItem> {
    return this.post<SpecialtyTypeItem>('/api/specialty-types', data);
  }
  async updateSpecialtyType(id: number, data: SpecialtyTypeUpdateRequest): Promise<void> {
    return this.put(`/api/specialty-types/${id}`, data);
  }
}
