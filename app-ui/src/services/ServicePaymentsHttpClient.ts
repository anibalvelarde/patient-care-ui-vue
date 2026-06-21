// services/ServicePaymentsHttpClient.ts
import { HttpClientBase } from './HttpClientBase';
import type {
  ServicePaymentRecord,
  ServicePaymentCreateRequest,
  UnpaidProviderSessionSummary,
  QuincenaWindow,
  PayrollPreviewTherapist,
  BatchPayrollRequest,
  BatchPayrollResult,
  PendingPayrollSummary,
  PendingPayReport,
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

  async getPayrollPreview(from?: string, to?: string): Promise<PayrollPreviewTherapist[]> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const query = params.toString();
    return this.get<PayrollPreviewTherapist[]>(`/api/service-payments/payroll-preview${query ? `?${query}` : ''}`);
  }

  async runBatchPayroll(data: BatchPayrollRequest): Promise<BatchPayrollResult> {
    return this.post<BatchPayrollResult>('/api/service-payments/batch', data);
  }

  // Clinic-wide gross still owed to therapists. No range -> all-time outstanding (the dashboard tile default).
  async getPendingSummary(from?: string, to?: string): Promise<PendingPayrollSummary> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const query = params.toString();
    return this.get<PendingPayrollSummary>(`/api/service-payments/pending-summary${query ? `?${query}` : ''}`);
  }

  // Per-therapist breakdown behind the tile (Therapists › Pending Pay). No range -> all-time.
  async getPendingPayReport(from?: string, to?: string): Promise<PendingPayReport> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const query = params.toString();
    return this.get<PendingPayReport>(`/api/service-payments/pending-pay-report${query ? `?${query}` : ''}`);
  }
}
