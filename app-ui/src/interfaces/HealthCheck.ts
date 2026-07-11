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
  /** ISO-8601 UTC compile-time stamp; absent on API builds ≤ v120 (H2). */
  buildTimeUtc?: string;
  statuses: HealthCheckStatus[];
}
