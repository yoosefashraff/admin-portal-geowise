export type DispatchType = 'Manual' | 'Auto'

export type DispatchStatus = 'Dispatched' | 'In Progress' | 'Failed' | 'Completed'

export interface DispatchLog {
  id: string
  serviceName: string
  customerName: string
  dispatchType: DispatchType
  dispatchStatus: DispatchStatus
  dateTime: string
  assignedProvider?: string
  failureReason?: string
  reportId?: string
}

// Auto Dispatch Progress Types
export type DispatchProgressStatus = 'Processing' | 'Completed' | 'Failed'

export interface DispatchProgressItem {
  serviceId: string
  serviceName: string
  customerName: string
  status: DispatchProgressStatus
  failureReason?: string
  assignedProvider?: string
  completedAt?: string
}

export interface DispatchProgress {
  id: string
  startedAt: string
  items: DispatchProgressItem[]
  isComplete: boolean
}

// Auto Dispatch Report Types
export interface DispatchReport {
  id: string
  progressId: string
  completedCount: number
  failedCount: number
  totalCount: number
  completedAt: string
  items: DispatchProgressItem[]
}
