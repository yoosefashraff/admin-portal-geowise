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

export interface ApprovedUserCredit {
  Id?: number
  UserId: number
  ServiceId: number
  ApprovedCredits: number
  UsedCredits?: number
  RemainingCredits?: number
  StartDate: string // ISO datetime
  EndDate: string // ISO datetime
  RecurringPeriod: number
  IsActive: boolean
}

export interface CreateCreditRequest {
  UserId: number
  ServiceId: number
  ApprovedCredits: number
  StartDate: string
  EndDate: string
  RecurringPeriod: number
  IsActive: boolean
}

export interface UpdateCreditRequest extends ApprovedUserCredit {
  Id: number
}

export interface CreditListResponse {
  data: ApprovedUserCredit[]
  totalCount?: number
  pageNumber?: number
  pageSize?: number
}

/**
 * Create a new ApprovedUserCredit record
 */
export async function createApprovedUserCredit(
  data: CreateCreditRequest
): Promise<ApprovedUserCredit> {
  const response = await fetch(`${API_BASE_URL}/ApprovedUserCredits/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': getCookieHeader(),
    },
    credentials: 'include', // Include cookies
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to create credit: ${response.status} ${errorText}`)
  }

  return response.json()
}

/**
 * Update an existing ApprovedUserCredit record
 */
export async function updateApprovedUserCredit(
  data: UpdateCreditRequest
): Promise<ApprovedUserCredit> {
  const response = await fetch(`${API_BASE_URL}/ApprovedUserCredits/Update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': getCookieHeader(),
    },
    credentials: 'include', // Include cookies
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to update credit: ${response.status} ${errorText}`)
  }

  return response.json()
}

/**
 * Get ApprovedUserCredits for the current user (from session)
 */
export async function getApprovedUserCreditsByUserId(): Promise<ApprovedUserCredit[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/ApprovedUserCredits/GetByUserId`, {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Cookie': getCookieHeader(),
      },
      credentials: 'include', // Include cookies
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to get credits: ${response.status} ${errorText}`)
    }

    return response.json()
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
 * Get ApprovedUserCredit by ID
 */
export async function getApprovedUserCreditById(id: number): Promise<ApprovedUserCredit> {
  const response = await fetch(`${API_BASE_URL}/ApprovedUserCredits/GetById?id=${id}`, {
    method: 'GET',
    headers: {
      'Cookie': getCookieHeader(),
    },
    credentials: 'include', // Include cookies
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get credit: ${response.status} ${errorText}`)
  }

  return response.json()
}

/**
 * List ApprovedUserCredits with filters
 */
export async function listApprovedUserCredits(params: {
  PageNumber?: number
  PageSize?: number
  UserId?: number
  ServiceId?: number
  IsActive?: boolean
  SearchTerm?: string
}): Promise<CreditListResponse> {
  const queryParams = new URLSearchParams()
  
  if (params.PageNumber) queryParams.append('PageNumber', params.PageNumber.toString())
  if (params.PageSize) queryParams.append('PageSize', params.PageSize.toString())
  if (params.UserId) queryParams.append('UserId', params.UserId.toString())
  if (params.ServiceId) queryParams.append('ServiceId', params.ServiceId.toString())
  if (params.IsActive !== undefined) queryParams.append('IsActive', params.IsActive.toString())
  if (params.SearchTerm) queryParams.append('SearchTerm', params.SearchTerm)

  const url = `${API_BASE_URL}/ApprovedUserCredits/List?${queryParams.toString()}`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cookie': getCookieHeader(),
    },
    credentials: 'include', // Include cookies
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to list credits: ${response.status} ${errorText}`)
  }

  // Check if response is JSON
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text()
    console.warn('API returned non-JSON response:', text.substring(0, 200))
    throw new Error(`API returned non-JSON response. Status: ${response.status}`)
  }

  const data = await response.json()
  
  // Handle different response formats
  if (Array.isArray(data)) {
    return { data }
  } else if (data.data && Array.isArray(data.data)) {
    return data
  } else if (data.items && Array.isArray(data.items)) {
    return { data: data.items, ...data }
  } else {
    // Return empty data if format is unexpected
    console.warn('Unexpected API response format:', data)
    return { data: [] }
  }
}

/**
 * Delete ApprovedUserCredit (soft delete)
 */
export async function deleteApprovedUserCredit(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/ApprovedUserCredits/Delete?id=${id}`, {
    method: 'POST',
    headers: {
      'Cookie': getCookieHeader(),
    },
    credentials: 'include', // Include cookies
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to delete credit: ${response.status} ${errorText}`)
  }
}
