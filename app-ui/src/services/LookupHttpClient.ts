import { HttpClientBase } from './HttpClientBase';
import type { LookupItem, LookupCreateRequest, LookupUpdateRequest } from '../interfaces/Lookups';

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
}
