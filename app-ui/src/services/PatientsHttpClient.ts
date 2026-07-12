// services/PatientsHttpClient.ts
import { HttpClientBase } from './HttpClientBase';
import type { Patient, PatientCreateRequest, PatientUpdateRequest, PatientCaretakerSummary } from '../interfaces/Patient';
import type { DelinquentPatient } from '../interfaces/Delinquency';
import type { PagedResult, PatientSessionHistorySummary, PatientHistorySession } from '../interfaces/SessionHistory';
import type { PatientMergeRequest, PatientMergePreview, PatientMergeResult } from '../interfaces/PatientMerge';

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

  // WP-21 (F1): paged patient summaries ordered by most-recent-session first.
  async getSessionHistory(search: string, page: number, pageSize = 30): Promise<PagedResult<PatientSessionHistorySummary>> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search.trim()) params.set('search', search.trim());
    return this.get<PagedResult<PatientSessionHistorySummary>>(`/api/patients/session-history?${params.toString()}`);
  }

  // WP-21 (F1): one patient's paged sessions, newest first.
  async getPatientSessions(patientId: number, page: number, pageSize = 25): Promise<PagedResult<PatientHistorySession>> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return this.get<PagedResult<PatientHistorySession>>(`/api/patients/${patientId}/sessions?${params.toString()}`);
  }

  // WP-22 (F2): duplicate-patient merge — SYSADMIN-only (Patients.Merge, wildcard-only claim).
  async previewMerge(request: PatientMergeRequest): Promise<PatientMergePreview> {
    return this.post<PatientMergePreview>('/api/patients/merge/preview', request);
  }

  async executeMerge(request: PatientMergeRequest): Promise<PatientMergeResult> {
    return this.post<PatientMergeResult>('/api/patients/merge', request);
  }
}
