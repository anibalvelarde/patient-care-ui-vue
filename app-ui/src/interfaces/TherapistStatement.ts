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

// Therapist Payroll (WP-14). Populated once service payments touch in-range sessions.
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
  totalServicePaymentsApplied: number // sum of in-range service-payment allocations (WP-14)
  estimatedAmountDue: number          // = totalProviderAmount - totalServicePaymentsApplied
}

export interface TherapistStatement {
  therapistId: number
  therapistName: string
  statementDate: string               // yyyy-MM-dd
  periodStart: string
  periodEnd: string
  isProForma: boolean                 // false once any service payment touches an in-range session (WP-14)
  patients: TherapistStatementPatient[]
  servicePayments: ServicePaymentItem[]  // populated since WP-14
  summary: TherapistStatementSummary
}
