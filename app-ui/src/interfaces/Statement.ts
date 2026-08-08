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
  /** Service charge only: amount − discountAmount. Excludes the add-ons below. */
  netCharge: number
  /** WP-40: on-site trip charge on this session; null = in-clinic. */
  onSiteChargeAmount?: number | null
  /**
   * WP-49 (BR3): late chargeback in force; null = none, 0 = applied then waived.
   * Optional so an older API keeps the page working.
   */
  lateFeeAmount?: number | null
  amountPaid: number
  /**
   * The collectible balance. Reconciles as
   * netCharge + onSiteChargeAmount + lateFeeAmount − amountPaid.
   * All three add-on terms must be displayed or the arithmetic looks wrong to a caretaker.
   */
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
  /** WP-40: total on-site trip charges. Optional — an older API omits it. */
  totalOnSiteCharges?: number
  /** WP-49 (BR3): total late chargebacks in force. Optional — an older API omits it. */
  totalLateFees?: number
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
