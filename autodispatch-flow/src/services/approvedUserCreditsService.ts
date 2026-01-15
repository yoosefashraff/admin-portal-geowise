// API Base URL - matches backend configuration
// Uses same environment variables as main app (VITE_ prefix for Vite)
// In development, use Vite proxy to avoid CORS issues
// In production, use direct API URL (always HTTPS)
function getApiBaseUrl(): string {
  // Check for DEV environment variable (same as main app)
  const devUrl = import.meta.env.VITE_DEV_API_URL || import.meta.env.VITE_SERVICE_REQUESTS_API_URL;
  
  if (import.meta.env.DEV) {
    // Development: Use Vite proxy (which proxies to DEV backend)
    return '/api';
  } else {
    // Production: Use direct URL (always HTTPS)
    // If DEV URL is set, use it (for testing), but ensure it's HTTPS
    if (devUrl) {
      let url = devUrl.replace(/^["']|["']$/g, '').trim();
      // Ensure HTTPS in production (fix mixed content errors)
      if (url.startsWith('http://')) {
        url = url.replace('http://', 'https://');
        console.warn('⚠️ [Auto-Dispatch] Converted HTTP to HTTPS for production:', url);
      }
      // If no protocol, assume HTTPS
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      return url;
    }
    return 'https://gw5cn.geowise.ai';
  }
}

const API_BASE_URL = getApiBaseUrl();

/**
 * Get cookies from browser and format as Cookie header value
 * Note: For cross-origin requests, browsers may block manually set Cookie headers.
 * We rely on credentials: 'include' for automatic cookie handling.
 */
function getCookieHeader(): string {
  // Return cookies for logging/debugging, but browsers handle cookies via credentials: 'include'
  const cookies = document.cookie;
  if (!cookies) {
    console.warn('⚠️ [Auto-Dispatch] No cookies found in document.cookie. Make sure you are logged in.');
  }
  return cookies;
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
    if (response.status === 401) {
      console.error('❌ [Auto-Dispatch] Authentication failed (401) when creating credit');
      throw new Error('Authentication failed. Your session may have expired. Please log out and log back in, then try again.');
    }
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
    if (response.status === 401) {
      console.error('❌ [Auto-Dispatch] Authentication failed (401) when updating credit');
      throw new Error('Authentication failed. Your session may have expired. Please log out and log back in, then try again.');
    }
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
      if (response.status === 401) {
        console.error('❌ [Auto-Dispatch] Authentication failed (401) when getting credits by user ID');
        throw new Error('Authentication failed. Your session may have expired. Please log out and log back in, then try again.');
      }
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
    if (response.status === 401) {
      console.error('❌ [Auto-Dispatch] Authentication failed (401) when getting credit by ID');
      throw new Error('Authentication failed. Your session may have expired. Please log out and log back in, then try again.');
    }
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
  
  // Log API configuration for debugging
  console.log('🔍 [Auto-Dispatch] Credits API Request:', {
    url,
    apiBaseUrl: API_BASE_URL,
    env: import.meta.env.DEV ? 'DEV' : 'PROD',
    viteDevApiUrl: import.meta.env.VITE_DEV_API_URL || 'not set',
    viteServiceRequestsApiUrl: import.meta.env.VITE_SERVICE_REQUESTS_API_URL || 'not set',
    params
  });
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cookie': getCookieHeader(),
    },
    credentials: 'include', // Include cookies
  })

  if (!response.ok) {
    const errorText = await response.text()
    if (response.status === 401) {
      console.error('❌ [Auto-Dispatch] Authentication failed (401). Possible causes:', {
        status: 401,
        url,
        apiBaseUrl: API_BASE_URL,
        hasCookies: !!document.cookie,
        cookieLength: document.cookie.length,
        possibleCauses: [
          'Session expired - user needs to log in again',
          'Cookies not being sent due to CORS/SameSite policy',
          'Backend authentication service unavailable',
          'API URL mismatch (check HTTPS vs HTTP)'
        ]
      });
      throw new Error('Authentication failed. Your session may have expired. Please log out and log back in, then try again.');
    }
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
  
  console.log('🔍 [Auto-Dispatch] Credits API Response:', {
    responseType: typeof data,
    isArray: Array.isArray(data),
    hasData: !!data.data,
    hasObject: !!data.Object,
    hasStatus: 'Status' in data,
    status: data.Status,
    keys: Object.keys(data || {})
  })
  
  // Handle different response formats (matching main app's API response format)
  if (Array.isArray(data)) {
    return { data }
  } else if (data.data && Array.isArray(data.data)) {
    return data
  } else if (data.Object && Array.isArray(data.Object)) {
    // Main app format: { Status: 201, Object: [...] }
    return { data: data.Object }
  } else if (data.items && Array.isArray(data.items)) {
    return { data: data.items, ...data }
  } else {
    // Return empty data if format is unexpected
    console.warn('⚠️ [Auto-Dispatch] Unexpected API response format:', data)
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
    if (response.status === 401) {
      console.error('❌ [Auto-Dispatch] Authentication failed (401) when deleting credit');
      throw new Error('Authentication failed. Your session may have expired. Please log out and log back in, then try again.');
    }
    throw new Error(`Failed to delete credit: ${response.status} ${errorText}`)
  }
}
