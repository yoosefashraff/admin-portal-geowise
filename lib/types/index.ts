// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

//

export type StaffStatus = "available" | "on-job" | "en-route" | "offline"

export interface Staff {
  id: string
  name: string
  role: string
  status: StaffStatus
  zone: string
  avatar?: string
  location: {
    lat: number
    lng: number
  }
  currentBooking?: string
  nextBookingTime?: Date
  timeRemaining?: number // minutes
  bookings: Booking[],
  phone: string,
  efficiency: number,
  rating: number
}

export interface Booking {
  id: string
  time: Date
  endTime: Date
  customerName: string
  address: string
  serviceType: string
  status: "scheduled" | "in-progress" | "completed" | "cancelled"
}

export type JobStatus = "scheduled" | "in-progress" | "completed" | "cancelled" | "at-risk"

export interface Job {
  id: string
  staffId: string
  customerName: string
  address: string
  serviceType: string
  scheduledTime: Date
  endTime: Date
  status: JobStatus
  type: string
  startTime: Date
  location: {
    lat: number
    lng: number
  }
}

export type AlertSeverity = "high" | "medium" | "low"
export type AlertType = "late-arrival" | "running-long" | "unassigned" | "staff-offline"

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  staffId?: string
  jobId?: string
  timestamp: Date
  dismissed: boolean
}

export type ActivityType =
  | "booking-assigned"
  | "booking-reassigned"
  | "booking-completed"
  | "booking-cancelled"
  | "job-at-risk" // Added new activity type for at-risk jobs
  | "status-change"

export interface Activity {
  id: string
  type: ActivityType
  actor: string
  actorType: "staff" | "system"
  action: string
  relatedStaffId?: string
  relatedJobId?: string
  timestamp: Date
}

export interface Filters {
  staff: string[]
  zones: string[]
  serviceTypes: string[]
  statuses: StaffStatus[]
}