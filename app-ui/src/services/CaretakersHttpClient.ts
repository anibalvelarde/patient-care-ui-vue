// services/CaretakersHttpClient.ts
import { HttpClientBase } from './HttpClientBase';
import type { Caretaker, CaretakerCreateRequest, CaretakerUpdateRequest, CaretakerPatientSummary, CaretakerLookupItem } from '../interfaces/Caretaker';
import type { PagedResult } from '../interfaces/SessionHistory';
import type { ListQuery } from './PatientsHttpClient';

export class CaretakersHttpClient extends HttpClientBase {
  // WP-30 (U2): paged-by-default (BREAKING pair of WP-30B — was a bare array).
  // search = name/email; isActive omitted = all; pageSize clamped server-side (max 100).
  async getCaretakers(query: ListQuery = {}): Promise<PagedResult<Caretaker>> {
    const params = new URLSearchParams({ page: String(query.page ?? 1), pageSize: String(query.pageSize ?? 30) });
    if (query.search?.trim()) params.set('search', query.search.trim());
    if (query.isActive !== undefined) params.set('isActive', String(query.isActive));
    return this.get<PagedResult<Caretaker>>(`/api/caretakers?${params.toString()}`);
  }

  // WP-30 (U2): slim typeahead lookup — server caps at 20, ordered by name; q min length 1.
  async lookupCaretakers(q: string): Promise<CaretakerLookupItem[]> {
    const params = new URLSearchParams({ q });
    return this.get<CaretakerLookupItem[]>(`/api/caretakers/lookup?${params.toString()}`);
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
