// interfaces/HealthCheck.ts

// Maps to API's GET /api/health/checks response
export interface HealthCheckStatus {
  name: string;
  status: 'Healthy' | 'Degraded' | 'Unhealthy';
  description: string;
  data: Record<string, unknown>;
}

export interface HealthCheckResponse {
  version: string;
  statuses: HealthCheckStatus[];
}
