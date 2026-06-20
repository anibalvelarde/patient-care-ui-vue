// services/ServicePaymentsHttpClient.ts
import { HttpClientBase } from './HttpClientBase';
import type {
  ServicePaymentRecord,
  ServicePaymentCreateRequest,
  UnpaidProviderSessionSummary,
  QuincenaWindow,
} from '../interfaces/ServicePayment';

export class ServicePaymentsHttpClient extends HttpClientBase {
  async getServicePayments(therapistId: number, from?: string, to?: string): Promise<ServicePaymentRecord[]> {
    const params = new URLSearchParams();
    params.append('therapistId', String(therapistId));
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return this.get<ServicePaymentRecord[]>(`/api/service-payments?${params.toString()}`);
  }

  async getServicePayment(id: number): Promise<ServicePaymentRecord> {
    return this.get<ServicePaymentRecord>(`/api/service-payments/${id}`);
  }

  async getUnpaidSessions(therapistId: number, from?: string, to?: string): Promise<UnpaidProviderSessionSummary[]> {
    const params = new URLSearchParams();
    params.append('therapistId', String(therapistId));
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return this.get<UnpaidProviderSessionSummary[]>(`/api/service-payments/unpaid-sessions?${params.toString()}`);
  }

  async getQuincena(date?: string): Promise<QuincenaWindow> {
    const query = date ? `?date=${date}` : '';
    return this.get<QuincenaWindow>(`/api/service-payments/quincena${query}`);
  }

  async createServicePayment(data: ServicePaymentCreateRequest): Promise<ServicePaymentRecord> {
    return this.post<ServicePaymentRecord>('/api/service-payments', data);
  }
}
