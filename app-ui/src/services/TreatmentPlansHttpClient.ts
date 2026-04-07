// services/TreatmentPlansHttpClient.ts
import { HttpClientBase } from './HttpClientBase';
import type { TreatmentPlan, TreatmentPlanRequest, BulkScheduleRequest, BulkScheduleResult, PlanSessionInfo, PlanProgressSummary } from '../interfaces/TreatmentPlan';

export class TreatmentPlansHttpClient extends HttpClientBase {
  async getByPatient(patientId: number): Promise<TreatmentPlan[]> {
    return this.get<TreatmentPlan[]>(`/api/treatment-plans/patient/${patientId}`);
  }

  async getById(id: number): Promise<TreatmentPlan> {
    return this.get<TreatmentPlan>(`/api/treatment-plans/${id}`);
  }

  async create(data: TreatmentPlanRequest): Promise<TreatmentPlan> {
    return this.post<TreatmentPlan>('/api/treatment-plans', data);
  }

  async update(id: number, data: TreatmentPlanRequest): Promise<TreatmentPlan> {
    return this.putWithResponse<TreatmentPlan>(`/api/treatment-plans/${id}`, data);
  }

  async activate(id: number): Promise<TreatmentPlan> {
    return this.putWithResponse<TreatmentPlan>(`/api/treatment-plans/${id}/activate`, {});
  }

  async complete(id: number): Promise<TreatmentPlan> {
    return this.putWithResponse<TreatmentPlan>(`/api/treatment-plans/${id}/complete`, {});
  }

  async cancel(id: number): Promise<TreatmentPlan> {
    return this.putWithResponse<TreatmentPlan>(`/api/treatment-plans/${id}/cancel`, {});
  }

  async schedule(id: number, data: BulkScheduleRequest): Promise<BulkScheduleResult> {
    return this.post<BulkScheduleResult>(`/api/treatment-plans/${id}/schedule`, data);
  }

  async getSessions(id: number): Promise<PlanSessionInfo[]> {
    return this.get<PlanSessionInfo[]>(`/api/treatment-plans/${id}/sessions`);
  }

  async getProgress(id: number): Promise<PlanProgressSummary> {
    return this.get<PlanProgressSummary>(`/api/treatment-plans/${id}/progress`);
  }
}
