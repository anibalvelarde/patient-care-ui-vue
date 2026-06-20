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
