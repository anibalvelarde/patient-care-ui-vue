// services/PatientsHttpClient.ts
import { HttpClientBase } from './HttpClientBase';
import type { Patient, PatientCreateRequest, PatientUpdateRequest, PatientCaretakerSummary } from '../interfaces/Patient';
import type { DelinquentPatient } from '../interfaces/Delinquency';

export class PatientsHttpClient extends HttpClientBase {
  async getPatients(): Promise<Patient[]> {
    return this.get<Patient[]>('/api/patients');
  }

  async getPatient(id: number): Promise<Patient> {
    return this.get<Patient>(`/api/patients/${id}`);
  }

  async createPatient(data: PatientCreateRequest): Promise<Patient> {
    return this.post<Patient>('/api/patients', data);
  }

  async updatePatient(id: number, data: PatientUpdateRequest): Promise<void> {
    return this.put(`/api/patients/${id}`, data);
  }

  async getPastDuePatients(): Promise<DelinquentPatient[]> {
    return this.get<DelinquentPatient[]>('/api/patients/pastdue');
  }

  async getPatientCaretakers(patientId: number): Promise<PatientCaretakerSummary[]> {
    return this.get<PatientCaretakerSummary[]>(`/api/patients/${patientId}/caretakers`);
  }
}
