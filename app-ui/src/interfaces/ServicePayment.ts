// interfaces/ServicePayment.ts
//
// Mirrors the API DTOs from `_contracts/service-payments-api.md` (WP-14). Therapist payroll —
// the direction-flipped mirror of the Caretaker Payment interfaces. JSON is camelCase.

import type { PaymentTypeInfo } from './Payment';

export interface SessionServiceAllocationItem {
  sessionId: number
  amountApplied: number
}

export interface ServicePaymentCreateRequest {
  therapistId: number
  paymentDate: string                 // ISO date (yyyy-MM-dd) or date-time
  amount: number
  paymentTypeId: number
  referenceNumber?: string | null
  notes?: string | null
  sessionAllocations: SessionServiceAllocationItem[]
}

export interface ServiceAllocationDetail {
  sessionServicePaymentId: number
  sessionId: number
  sessionDate: string
  patientName: string
  amountApplied: number
}

export interface ServicePaymentRecord {
  servicePaymentId: number
  therapistId: number
  therapistName: string
  paymentDate: string
  amount: number
  paymentType: PaymentTypeInfo
  referenceNumber: string | null
  notes: string | null
  allocations: ServiceAllocationDetail[]
  totalApplied: number
  unallocatedAmount: number
  reversesServicePaymentId: number | null   // set when this record is itself a reversal entry (WP-14.5)
  isReversed: boolean                        // true when a later reversal entry offsets this payment
}

// WP-14.5 — append-only reversal of an issued payment.
export interface ReverseServicePaymentRequest {
  reason: string
  paymentDate: string   // local business date (yyyy-MM-dd) the reversal is stamped with — sent as browser-local "today"
}

export interface UnpaidProviderSessionSummary {
  sessionId: number
  sessionDate: string
  sessionTime: string
  patientId: number
  patientName: string
  therapyType: string
  providerAmount: number
  alreadyApplied: number
  remainingProviderAmount: number
}

export interface QuincenaWindow {
  from: string
  to: string
}

// WP-14.5 "Run Payroll" (batch all-therapists).
export interface PayrollPreviewTherapist {
  therapistId: number
  therapistName: string
  sessionCount: number
  totalRemaining: number
  sessions: UnpaidProviderSessionSummary[]
}

export interface BatchPayrollRequest {
  from?: string | null
  to?: string | null
  paymentDate: string
  paymentTypeId: number
  referenceNumber?: string | null
  notes?: string | null
  therapistIds: number[]
}

export interface BatchPayrollResult {
  payments: ServicePaymentRecord[]
  therapistCount: number
  totalPaid: number
}

// WP-14.5 "Pending therapist payments" dashboard tile — clinic-wide gross still owed to therapists.
export interface PendingPayrollSummary {
  totalPending: number
  therapistCount: number
  sessionCount: number
}

// WP-14.5 read-only "Pending Pay" report (Therapists › Pending Pay tab) — per-therapist breakdown.
export interface PendingPayReportRow {
  therapistId: number
  therapistName: string
  sessionCount: number
  firstSessionDate: string        // yyyy-MM-dd
  lastSessionDate: string         // yyyy-MM-dd
  distinctPatientCount: number
  grossBilled: number             // Σ session Amount (pre-discount)
  amountOwed: number              // Σ (ProviderAmount − applied)
  owedPctOfGross: number          // amountOwed / grossBilled * 100
}

export interface PendingPayReport {
  rows: PendingPayReportRow[]
  therapistCount: number
  sessionCount: number
  totalGrossBilled: number
  totalOwed: number
  owedPctOfGross: number
}
