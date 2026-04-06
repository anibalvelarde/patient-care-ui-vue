// services/TreatmentPlansHttpClient.ts
import { HttpClientBase } from './HttpClientBase';
import type { TreatmentPlan, TreatmentPlanRequest } from '../interfaces/TreatmentPlan';

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
}
