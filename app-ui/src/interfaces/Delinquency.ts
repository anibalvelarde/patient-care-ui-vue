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
  // WP-49 (BR3): late chargeback in force; already inside amountDue. Optional so older
  // payloads and existing fixtures stay valid.
  lateFeeAmount?: number | null;
}

export interface DelinquentPatient {
  partyType: string;
  party: DelinquentParty;
  pastDueSessions: number;
  /**
   * The CHARGE side of the balance — everything billed, before payments.
   *
   * WP-49 fixed this server-side: it used to be a hand-copied `Amount − Discount`, which
   * silently dropped the on-site trip charge (a live bug) and would have dropped the late fee
   * too. It now comes from the shared TotalCharges(), so
   * `pastDueTotalAmount − amountPaidSoFar` genuinely equals the sum of the sessions'
   * amountDue. No UI arithmetic changed — the inputs got correct.
   */
  pastDueTotalAmount: number;
  amountPaidSoFar: number;
  delinquency: DelinquentSession[];
}

export type DelinquentTherapist = DelinquentPatient;
