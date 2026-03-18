// services/TherapistsHttpClient.ts
import { HttpClientBase } from './HttpClientBase';
import type { Therapist, TherapistCreateRequest, TherapistUpdateRequest } from '../interfaces/Therapist';
import type { DelinquentTherapist } from '../interfaces/Delinquency';

export class TherapistsHttpClient extends HttpClientBase {
  async getTherapists(): Promise<Therapist[]> {
    return this.get<Therapist[]>('/api/therapists');
  }

  async getTherapist(id: number): Promise<Therapist> {
    return this.get<Therapist>(`/api/therapists/${id}`);
  }

  async createTherapist(data: TherapistCreateRequest): Promise<Therapist> {
    return this.post<Therapist>('/api/therapists', data);
  }

  async updateTherapist(id: number, data: TherapistUpdateRequest): Promise<void> {
    return this.put(`/api/therapists/${id}`, data);
  }

  async getPastDueForTherapist(id: number): Promise<DelinquentTherapist> {
    return this.get<DelinquentTherapist>(`/api/therapists/${id}/pastdue`);
  }

  async getPastDueTherapists(therapists: Therapist[]): Promise<DelinquentTherapist[]> {
    const results = await Promise.all(
      therapists.map((t) => this.getPastDueForTherapist(t.therapistId).catch(() => null))
    );
    return results.filter(
      (r): r is DelinquentTherapist => r !== null && r.pastDueSessions > 0
    );
  }
}
