// interfaces/Payment.ts

export interface PaymentTypeInfo {
  paymentTypeId: number
  abbreviation: string
  name: string
}

export interface AllocationDetail {
  sessionPaymentId: number
  sessionId: number
  sessionDate: string
  patientName: string
  therapistName: string
  amountAllocated: number
}

export interface PaymentRecord {
  paymentId: number
  amount: number
  paymentDate: string
  caretakerId: number
  caretakerName: string
  paymentType: PaymentTypeInfo
  checkNumber: string | null
  allocations: AllocationDetail[]
  totalAllocated: number
  unallocatedAmount: number
}

export interface SessionAllocationItem {
  sessionId: number
  amountAllocated: number
}

export interface PaymentCreateRequest {
  amount: number
  paymentDate: string
  caretakerId: number
  paymentTypeId: number
  checkNumber?: string | null
  sessionAllocations: SessionAllocationItem[]
}

export interface PaymentUpdateRequest {
  amount: number
  paymentDate: string
  caretakerId: number
  paymentTypeId: number
  checkNumber?: string | null
  sessionAllocations: SessionAllocationItem[]
}

export interface SessionPaymentDetail {
  sessionPaymentId: number
  paymentId: number
  amountAllocated: number
  paymentDate: string
  paymentTotalAmount: number
  caretakerId: number
  caretakerName: string
  paymentType: PaymentTypeInfo
  checkNumber: string | null
}

export interface UnpaidSessionSummary {
  sessionId: number
  sessionDate: string
  sessionTime: string
  patientId: number
  patientName: string
  therapistName: string
  amount: number
  discountAmount: number
  amountPaid: number
  amountDue: number
  isPastDue: boolean
}
