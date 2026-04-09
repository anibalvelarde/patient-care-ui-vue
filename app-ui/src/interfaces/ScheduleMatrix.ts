export interface ScheduleSlot {
  date: string;
  time: string;
  sessionId: number | null;
  patientName: string | null;
  specialtyAbbreviation: string | null;
  appointmentStatusId: number | null;
  statusName: string | null;
}

export interface TherapistScheduleRow {
  therapistId: number;
  therapistName: string;
  specialties: string[];
  slots: ScheduleSlot[];
}

export interface ScheduleMatrixResponse {
  weekStart: string;
  weekEnd: string;
  siteId: number;
  siteName: string;
  therapists: TherapistScheduleRow[];
}
