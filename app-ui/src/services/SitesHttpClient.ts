// services/SitesHttpClient.ts
import { HttpClientBase } from './HttpClientBase';
import type { Site, SiteCreateRequest, SiteUpdateRequest } from '../interfaces/Site';

export class SitesHttpClient extends HttpClientBase {
  async getSites(): Promise<Site[]> {
    return this.get<Site[]>('/api/sites');
  }

  async getSite(id: number): Promise<Site> {
    return this.get<Site>(`/api/sites/${id}`);
  }

  async createSite(data: SiteCreateRequest): Promise<Site> {
    return this.post<Site>('/api/sites', data);
  }

  async updateSite(id: number, data: SiteUpdateRequest): Promise<void> {
    return this.put(`/api/sites/${id}`, data);
  }
}
