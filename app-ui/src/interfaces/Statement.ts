// interfaces/Statement.ts

export interface StatementPatient {
  patientId: number
  patientName: string
  isPrimaryCaretaker: boolean
  relationshipToPatient: string
}

export interface ChargePaymentApplied {
  paymentId: number
  paymentDate: string
  amountAllocated: number
  paymentType: string
  checkNumber: string | null
}

export interface StatementCharge {
  sessionId: number
  sessionDate: string
  patientName: string
  therapistName: string
  therapyType: string
  amount: number
  discountAmount: number
  netCharge: number
  amountPaid: number
  amountDue: number
  isPastDue: boolean
  paymentsApplied: ChargePaymentApplied[]
}

export interface StatementPaymentAllocation {
  sessionId: number
  sessionDate: string
  patientName: string
  amountAllocated: number
}

export interface StatementPayment {
  paymentId: number
  paymentDate: string
  amount: number
  paymentType: string
  checkNumber: string | null
  allocations: StatementPaymentAllocation[]
}

export interface StatementSummary {
  totalCharges: number
  totalDiscounts: number
  totalNetCharges: number
  totalPayments: number
  outstandingBalance: number
  pastDueAmount: number
  pastDueSessionCount: number
}

export interface AccountStatement {
  caretakerId: number
  caretakerName: string
  statementDate: string
  periodStart: string
  periodEnd: string
  patients: StatementPatient[]
  charges: StatementCharge[]
  payments: StatementPayment[]
  summary: StatementSummary
}
