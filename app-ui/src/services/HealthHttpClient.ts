// services/HealthHttpClient.ts
import { HttpClientBase } from './HttpClientBase';
import type { HealthCheckResponse } from '../interfaces/HealthCheck';

export class HealthHttpClient extends HttpClientBase {
  async getHealthChecks(): Promise<HealthCheckResponse> {
    return this.get<HealthCheckResponse>('/api/health/checks');
  }
}
