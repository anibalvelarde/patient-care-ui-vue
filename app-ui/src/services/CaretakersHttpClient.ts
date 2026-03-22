// services/CaretakersHttpClient.ts
import { HttpClientBase } from './HttpClientBase';
import type { Caretaker, CaretakerCreateRequest, CaretakerUpdateRequest } from '../interfaces/Caretaker';

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
}
