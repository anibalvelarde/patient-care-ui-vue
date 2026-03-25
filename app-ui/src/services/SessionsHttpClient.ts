// services/SessionsHttpClient.ts
import { HttpClientBase } from './HttpClientBase';
import type { Appointment, AppointmentStatusInfo, SessionEventRequest, ConfirmationRequest, ConfirmationRecord } from '../interfaces/Appointment';

export class SessionsHttpClient extends HttpClientBase {
  async getSessions(date: string): Promise<Appointment[]> {
    const formattedDate = this.formatDateForApi(date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
      throw new Error("Invalid date format.");
    }
    const url = `/api/Sessions/${formattedDate}/all`;
    return this.get<Appointment[]>(url);
  }

  async createSession(data: SessionEventRequest): Promise<Appointment> {
    return this.post<Appointment>('/api/Sessions', data);
  }

  async updateSession(id: number, data: Record<string, unknown>): Promise<void> {
    return this.put(`/api/Sessions/${id}`, data);
  }

  async getStatuses(): Promise<AppointmentStatusInfo[]> {
    return this.get<AppointmentStatusInfo[]>('/api/Sessions/statuses');
  }

  async confirmSession(id: number, data: ConfirmationRequest): Promise<Appointment> {
    return this.putWithResponse<Appointment>(`/api/Sessions/${id}/confirm`, data);
  }

  async cancelSession(id: number, reason?: string): Promise<Appointment> {
    return this.putWithResponse<Appointment>(`/api/Sessions/${id}/cancel`, { reason: reason || null });
  }

  async completeSession(id: number): Promise<Appointment> {
    return this.putWithResponse<Appointment>(`/api/Sessions/${id}/complete`, {});
  }

  async noShowSession(id: number): Promise<Appointment> {
    return this.putWithResponse<Appointment>(`/api/Sessions/${id}/noshow`, {});
  }

  async checkInSession(id: number): Promise<Appointment> {
    return this.putWithResponse<Appointment>(`/api/Sessions/${id}/checkin`, {});
  }

  async startTherapy(id: number): Promise<Appointment> {
    return this.putWithResponse<Appointment>(`/api/Sessions/${id}/start-therapy`, {});
  }

  async getUnconfirmed(params?: { from?: string; to?: string; days?: number }): Promise<Appointment[]> {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.days !== undefined) query.set('days', params.days.toString());
    const qs = query.toString();
    return this.get<Appointment[]>(`/api/Sessions/unconfirmed${qs ? '?' + qs : ''}`);
  }

  async getUpcoming(params?: { from?: string; to?: string; days?: number }): Promise<Appointment[]> {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.days !== undefined) query.set('days', params.days.toString());
    const qs = query.toString();
    return this.get<Appointment[]>(`/api/Sessions/upcoming${qs ? '?' + qs : ''}`);
  }

  async getConfirmations(id: number): Promise<ConfirmationRecord[]> {
    return this.get<ConfirmationRecord[]>(`/api/Sessions/${id}/confirmations`);
  }

  private formatDateForApi(date: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const [month, day, year] = date.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
}
