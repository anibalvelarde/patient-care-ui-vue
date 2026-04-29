// services/StatementsHttpClient.ts
import { HttpClientBase } from './HttpClientBase';
import type { AccountStatement } from '../interfaces/Statement';
import type { TherapistStatement } from '../interfaces/TherapistStatement';

export class StatementsHttpClient extends HttpClientBase {
  async getStatement(caretakerId: number, from?: string, to?: string): Promise<AccountStatement> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const query = params.toString();
    const url = `/api/caretakers/${caretakerId}/statement${query ? `?${query}` : ''}`;
    return this.get<AccountStatement>(url);
  }

  async getTherapistStatement(therapistId: number, from?: string, to?: string): Promise<TherapistStatement> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const query = params.toString();
    const url = `/api/therapists/${therapistId}/statement${query ? `?${query}` : ''}`;
    return this.get<TherapistStatement>(url);
  }
}
