export type ServiceRequestStatus = 'Approved' | 'Pending' | 'Draft' | 'Rejected'

export interface CreditInfo {
  approved: number
  used: number
  remaining: number
}

export interface ServiceRequest {
  id: string
  name: string
  phone: string
  service: string
  address: string
  credits: CreditInfo
  preferredStaff: string[]
  preferredDays: string[]
  status: ServiceRequestStatus
  selected?: boolean
  // API integration fields
  userId?: number
  serviceId?: number
  approvedUserCreditId?: number // ID from ApprovedUserCredits table
  createdAt?: string // ISO date string for sorting (newest first)
}
