// API Base URL - matches backend configuration
// In development, use Vite proxy to avoid CORS issues
// In production, use direct API URL
const API_BASE_URL = import.meta.env.DEV 
  ? '/api' // Use Vite proxy in development
  : 'https://gw5cn.geowise.ai' // Direct URL in production

/**
 * Get cookies from browser and format as Cookie header value
 */
function getCookieHeader(): string {
  return document.cookie
}

export interface BookingRequest {
  StartDate: string
  EndDate: string
  IsOnlyConfirmed?: boolean
  CompanyAdminId?: number
  BarberId?: number
}

export interface Booking {
  id: string | number
  customerName?: string
  customerPhone?: string
  serviceName?: string
  serviceId?: number
  address?: string
  status?: string
  credits?: {
    approved: number
    used: number
    remaining: number
  }
  preferredStaff?: string[]
  preferredDays?: string[]
  userId?: number
  approvedUserCreditId?: number
  [key: string]: any // Allow additional fields from API
}

/**
 * Fetch bookings/service requests from API
 * This endpoint is used to get the list of service requests for auto-dispatch
 */
export async function fetchBookings(params: BookingRequest): Promise<Booking[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/barber/FetchBookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': getCookieHeader(),
        'IsTest': 'false', // TODO: Get from config if needed
        'DeviceToken': 'web', // TODO: Get actual device token if needed
        'TimeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch bookings: ${response.status} ${errorText}`)
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.warn('API returned non-JSON response:', text.substring(0, 200))
      throw new Error(`API returned non-JSON response. Status: ${response.status}. This may indicate an authentication or endpoint issue.`)
    }

    const data = await response.json()
    
    // Handle different response formats
    if (Array.isArray(data)) {
      return data
    } else if (data.data && Array.isArray(data.data)) {
      return data.data
    } else if (data.bookings && Array.isArray(data.bookings)) {
      return data.bookings
    } else if (data && typeof data === 'object') {
      // If response is an object but not in expected format, log it and return empty array
      console.warn('Unexpected API response format. Expected array or object with data/bookings array. Got:', Object.keys(data))
      return []
    } else {
      // If response structure is unknown, return empty array
      console.warn('Unexpected API response format:', typeof data, data)
      return []
    }
  } catch (error) {
    // Provide more specific error messages
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(
        'Network error: Unable to connect to API. This may be a CORS issue. ' +
        'Make sure you are logged into the GeoWise application and the backend allows requests from this origin.'
      )
    }
    throw error
  }
}

/**
 * Fetch service requests for the current date range
 * Defaults to today's date range
 */
export async function fetchServiceRequests(
  startDate?: string,
  endDate?: string,
  onlyConfirmed?: boolean
): Promise<Booking[]> {
  const today = new Date()
  const defaultStartDate = startDate || today.toISOString().split('T')[0]
  const defaultEndDate = endDate || today.toISOString().split('T')[0]

  return fetchBookings({
    StartDate: `${defaultStartDate}T00:00:00Z`,
    EndDate: `${defaultEndDate}T23:59:59Z`,
    IsOnlyConfirmed: onlyConfirmed ?? false,
  })
}

/**
 * Fetch dispatch logs (historical bookings/dispatches)
 * Fetches bookings from a past date range to show dispatch history
 */
export async function fetchDispatchLogs(
  daysBack: number = 30,
  onlyConfirmed?: boolean
): Promise<Booking[]> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysBack)

  const startDateStr = startDate.toISOString().split('T')[0]
  const endDateStr = endDate.toISOString().split('T')[0]

  return fetchBookings({
    StartDate: `${startDateStr}T00:00:00Z`,
    EndDate: `${endDateStr}T23:59:59Z`,
    IsOnlyConfirmed: onlyConfirmed ?? false,
  })
}
