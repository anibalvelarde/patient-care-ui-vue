// services/PaymentsHttpClient.ts
import { HttpClientBase } from './HttpClientBase';
import type {
  PaymentRecord,
  PaymentTypeInfo,
  PaymentCreateRequest,
  PaymentUpdateRequest,
  UnpaidSessionSummary,
  SessionPaymentDetail,
} from '../interfaces/Payment';

export class PaymentsHttpClient extends HttpClientBase {
  async getPaymentTypes(): Promise<PaymentTypeInfo[]> {
    return this.get<PaymentTypeInfo[]>('/api/payments/types');
  }

  async getPayments(caretakerId?: number): Promise<PaymentRecord[]> {
    const url = caretakerId
      ? `/api/payments?caretakerId=${caretakerId}`
      : '/api/payments';
    return this.get<PaymentRecord[]>(url);
  }

  async getPayment(id: number): Promise<PaymentRecord> {
    return this.get<PaymentRecord>(`/api/payments/${id}`);
  }

  async createPayment(data: PaymentCreateRequest): Promise<PaymentRecord> {
    return this.post<PaymentRecord>('/api/payments', data);
  }

  async updatePayment(id: number, data: PaymentUpdateRequest): Promise<void> {
    return this.put(`/api/payments/${id}`, data);
  }

  async getCaretakerPayments(caretakerId: number): Promise<PaymentRecord[]> {
    return this.get<PaymentRecord[]>(`/api/caretakers/${caretakerId}/payments`);
  }

  async getUnpaidSessions(caretakerId: number): Promise<UnpaidSessionSummary[]> {
    return this.get<UnpaidSessionSummary[]>(`/api/caretakers/${caretakerId}/unpaid-sessions`);
  }

  async getSessionPayments(sessionId: number): Promise<SessionPaymentDetail[]> {
    return this.get<SessionPaymentDetail[]>(`/api/sessions/${sessionId}/payments`);
  }
}
