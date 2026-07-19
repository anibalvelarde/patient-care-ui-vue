import { HttpClientBase } from './HttpClientBase';
import type {
  LookupItem,
  LookupCreateRequest,
  LookupUpdateRequest,
  SpecialtyPriceHistory,
  SpecialtyPricesUpdateRequest,
} from '../interfaces/Lookups';

export class LookupHttpClient extends HttpClientBase {
  async getAll(tableName: string): Promise<LookupItem[]> {
    return this.get<LookupItem[]>(`/api/lookups/${tableName}`);
  }

  async create(tableName: string, data: LookupCreateRequest): Promise<LookupItem> {
    return this.post<LookupItem>(`/api/lookups/${tableName}`, data);
  }

  async update(tableName: string, id: number, data: LookupUpdateRequest): Promise<void> {
    return this.put(`/api/lookups/${tableName}/${id}`, data);
  }

  // WP-39: full per-duration price history for one specialty (admin modal; newest-first per duration).
  async getSpecialtyPrices(id: number): Promise<SpecialtyPriceHistory> {
    return this.get<SpecialtyPriceHistory>(`/api/lookups/specialty-types/${id}/prices`);
  }

  // WP-39: append-only — adds effective-dated price rows (never mutates history).
  // 204 success; 400 invalid; 403 without Specialties.Prices.Edit; 409 duplicate (duration, date).
  async putSpecialtyPrices(id: number, data: SpecialtyPricesUpdateRequest): Promise<void> {
    return this.put(`/api/lookups/specialty-types/${id}/prices`, data);
  }
}
