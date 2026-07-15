// services/PatientsHttpClient.ts
import { HttpClientBase } from './HttpClientBase';
import type { Patient, PatientCreateRequest, PatientUpdateRequest, PatientCaretakerSummary, PatientLookupItem } from '../interfaces/Patient';
import type { DelinquentPatient } from '../interfaces/Delinquency';
import type { PagedResult, PatientSessionHistorySummary, PatientHistorySession } from '../interfaces/SessionHistory';
import type { PatientMergeRequest, PatientMergePreview, PatientMergeResult } from '../interfaces/PatientMerge';

// WP-30 (U2): shared query shape for the paged list endpoints.
export interface ListQuery {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export class PatientsHttpClient extends HttpClientBase {
  // WP-30 (U2): paged-by-default (BREAKING pair of WP-30B — was a bare array).
  // search = name/MRN/cedula; isActive omitted = all; pageSize clamped server-side (max 100).
  async getPatients(query: ListQuery = {}): Promise<PagedResult<Patient>> {
    const params = new URLSearchParams({ page: String(query.page ?? 1), pageSize: String(query.pageSize ?? 30) });
    if (query.search?.trim()) params.set('search', query.search.trim());
    if (query.isActive !== undefined) params.set('isActive', String(query.isActive));
    return this.get<PagedResult<Patient>>(`/api/patients?${params.toString()}`);
  }

  // WP-30 (U2): slim typeahead lookup — server caps at 20, ordered by name; q min length 1.
  async lookupPatients(q: string): Promise<PatientLookupItem[]> {
    const params = new URLSearchParams({ q });
    return this.get<PatientLookupItem[]>(`/api/patients/lookup?${params.toString()}`);
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
