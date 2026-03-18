// interfaces/Delinquency.ts

export interface DelinquentParty {
  id: number;
  name: string;
  isValid: boolean;
}

export interface DelinquentSession {
  sessionId: number;
  sessionDate: string;
  sessionTime: string;
  patient: string;
  therapist: string;
  therapyTypes: string;
  amount: number;
  discount: number;
  amountPaid: number;
  amountDue: number;
  isPastDue: boolean;
  isPaidOff: boolean;
  notes: string;
  patientId: number;
  therapistId: number;
}

export interface DelinquentPatient {
  partyType: string;
  party: DelinquentParty;
  pastDueSessions: number;
  pastDueTotalAmount: number;
  amountPaidSoFar: number;
  delinquency: DelinquentSession[];
}

export type DelinquentTherapist = DelinquentPatient;
