// services/CaretakersHttpClient.ts
import { HttpClientBase } from './HttpClientBase';
import type { Caretaker, CaretakerCreateRequest, CaretakerUpdateRequest, CaretakerPatientSummary } from '../interfaces/Caretaker';

export class CaretakersHttpClient extends HttpClientBase {
  async getCaretakers(): Promise<Caretaker[]> {
    return this.get<Caretaker[]>('/api/caretakers');
  }

  async getCaretaker(id: number): Promise<Caretaker> {
    return this.get<Caretaker>(`/api/caretakers/${id}`);
  }

  async createCaretaker(data: CaretakerCreateRequest): Promise<Caretaker> {
    return this.post<Caretaker>('/api/caretakers', data);
  }

  async updateCaretaker(id: number, data: CaretakerUpdateRequest): Promise<void> {
    return this.put(`/api/caretakers/${id}`, data);
  }

  async getCaretakerPatients(caretakerId: number): Promise<CaretakerPatientSummary[]> {
    return this.get<CaretakerPatientSummary[]>(`/api/caretakers/${caretakerId}/patients`);
  }

  async linkPatient(caretakerId: number, patientId: number, isPrimary: boolean, relationship: string | null): Promise<void> {
    await this.post(`/api/caretakers/${caretakerId}/patients`, { patientId, isPrimary, relationship });
  }

  async unlinkPatient(caretakerId: number, patientId: number): Promise<void> {
    await this.delete(`/api/caretakers/${caretakerId}/patients/${patientId}`);
  }
}
