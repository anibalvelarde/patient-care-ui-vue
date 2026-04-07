// interfaces/TreatmentPlan.ts

export type PlanStatus = 'Draft' | 'Active' | 'Completed' | 'Cancelled';

export interface TreatmentPlanLine {
  id: number;
  treatmentPlanId: number;
  specialtyTypeId: number;
  specialtyAbbreviation: string;
  specialtyName: string;
  preferredTherapistId: number | null;
  preferredTherapistName: string | null;
  dayOfWeek: number | null;
  preferredTime: string | null;
  duration: number;
  sortOrder: number;
}

export interface TreatmentPlan {
  id: number;
  patientId: number;
  patientName: string;
  discoverySessionId: number;
  discoveryDate: string;
  discoverySpecialty: string;
  createdByTherapistId: number;
  createdByTherapistName: string;
  planStatus: PlanStatus;
  resultsDocumentUrl: string | null;
  weeklyFrequency: number;
  durationWeeks: number;
  notes: string | null;
  createdTimestamp: string;
  lastUpdatedTimestamp: string;
  lines: TreatmentPlanLine[];
}

export interface TreatmentPlanLineRequest {
  specialtyTypeId: number;
  preferredTherapistId: number | null;
  dayOfWeek: number | null;
  preferredTime: string | null;
  duration: number;
  sortOrder: number;
}

export interface TreatmentPlanRequest {
  patientId: number;
  discoverySessionId: number;
  createdByTherapistId: number;
  resultsDocumentUrl?: string | null;
  weeklyFrequency: number;
  durationWeeks: number;
  notes?: string | null;
  lines: TreatmentPlanLineRequest[];
}

export interface DiscoverySessionSummary {
  sessionId: number;
  sessionDate: string;
  specialtyAbbreviation: string;
  therapistName: string;
}

export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export function isDiscoverySpecialty(abbreviation: string): boolean {
  return /^(Obs-|Eval-|Vis-)/.test(abbreviation);
}

export function planStatusBadgeClass(status: PlanStatus): string {
  switch (status) {
    case 'Draft': return 'bg-slate-100 text-slate-600';
    case 'Active': return 'bg-emerald-100 text-emerald-700';
    case 'Completed': return 'bg-gray-100 text-gray-600';
    case 'Cancelled': return 'bg-red-100 text-red-700';
  }
}
