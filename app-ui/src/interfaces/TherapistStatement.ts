// interfaces/TherapistStatement.ts
//
// Mirrors the API DTO from `_contracts/therapists-api.md` (WP-13B).
// JSON serialization is camelCase (matches the Caretaker AccountStatement pattern).

export interface TherapistStatementSession {
  sessionId: number
  sessionDate: string
  sessionTime: string         // HH:mm
  therapyType: string         // resolved server-side: SpecialtyType.Name → TherapyTypes → "N/A"
  amount: number
  discountAmount: number
  providerAmount: number      // 0 for Cancelled/NoShow (server-side)
  statusName: string          // AppointmentStatus.Name
  isBillable: boolean         // true only when statusName === "Completed"
}

export interface TherapistStatementPatient {
  patientId: number
  patientName: string
  sessions: TherapistStatementSession[]
  subtotalFee: number
  subtotalDiscount: number
  subtotalProviderAmount: number  // Completed only
  completedCount: number
  nonBillableCount: number        // Cancelled + NoShow
}

// Reserved for the Therapist Payroll WP (WP-14). Always empty in WP-13B.
export interface ServicePaymentAllocation {
  sessionId: number
  amountApplied: number
}

export interface ServicePaymentItem {
  servicePaymentId: number
  paymentDate: string
  amount: number
  paymentTypeName: string
  referenceNumber: string
  notes: string
  allocations: ServicePaymentAllocation[]
}

export interface TherapistStatementSummary {
  totalCompletedSessions: number
  totalNonBillableSessions: number    // Cancelled + NoShow
  totalFee: number
  totalDiscount: number
  totalProviderAmount: number         // billable only
  totalServicePaymentsApplied: number // 0 in WP-13B
  estimatedAmountDue: number          // = totalProviderAmount - totalServicePaymentsApplied
}

export interface TherapistStatement {
  therapistId: number
  therapistName: string
  statementDate: string               // yyyy-MM-dd
  periodStart: string
  periodEnd: string
  isProForma: boolean                 // true until WP-14 ships
  patients: TherapistStatementPatient[]
  servicePayments: ServicePaymentItem[]  // always [] in WP-13B
  summary: TherapistStatementSummary
}
