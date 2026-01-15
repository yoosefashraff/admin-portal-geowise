"use server";

import { cookies } from "next/headers";
// Production API disabled - only using dev environment
import { createServiceRequestsAxios } from "@/lib/actions/serviceRequests.actions";

// Helper function to get dev environment URL (with backward compatibility)
function getDevApiUrl(): string | undefined {
  const devUrl = process.env.NEXT_PUBLIC_DEV_API_URL || process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL;
  return devUrl ? devUrl.replace(/^["']|["']$/g, '').trim() : undefined;
}

// Helper function to check if dev environment is configured
function isUsingDevEnvironment(): boolean {
  return !!getDevApiUrl();
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

export interface CreditListResponse {
  data: ApprovedUserCredit[]
  totalCount?: number
  pageNumber?: number
  pageSize?: number
}

export interface ListCreditsParams {
  PageNumber?: number
  PageSize?: number
  UserId?: number
  ServiceId?: number
  IsActive?: boolean
  SearchTerm?: string
}

/**
 * List ApprovedUserCredits with filters
 * Uses DEV environment if NEXT_PUBLIC_DEV_API_URL (or legacy NEXT_PUBLIC_SERVICE_REQUESTS_API_URL) is set
 * This ensures we fetch credits from the same environment where we import data
 */
export async function listApprovedUserCredits(
  params: ListCreditsParams
): Promise<{ Status: number; Message?: string; data?: ApprovedUserCredit[] }> {
  try {
    // Check cookie availability first
    const cookieStore = await cookies();
    const cookie = cookieStore.get('xyzCompAuthorize');
    const allCookies = cookieStore.getAll();
    
    // Use console.error to make it more visible in server logs
    console.error('🍪 ===== COOKIE CHECK FOR APPROVED USER CREDITS =====');
    console.error('🍪 Cookie Check for ApprovedUserCredits:', {
      cookieFound: !!cookie,
      cookieHasValue: !!cookie?.value,
      cookieLength: cookie?.value?.length || 0,
      cookiePreview: cookie?.value ? `${cookie.value.substring(0, 30)}...` : 'none',
      allCookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value, valueLength: c.value?.length || 0 })),
      cookieCount: allCookies.length
    });
    console.error('🍪 ===================================================');
    
    // Let axios-server handle cookie authentication (same as getCurrentUserAction)
    const queryParams = new URLSearchParams()
    
    if (params.PageNumber) queryParams.append('PageNumber', params.PageNumber.toString())
    if (params.PageSize) queryParams.append('PageSize', params.PageSize.toString())
    if (params.UserId) queryParams.append('UserId', params.UserId.toString())
    if (params.ServiceId) queryParams.append('ServiceId', params.ServiceId.toString())
    if (params.IsActive !== undefined) queryParams.append('IsActive', params.IsActive.toString())
    if (params.SearchTerm) queryParams.append('SearchTerm', params.SearchTerm)

    const url = `/ApprovedUserCredits/List${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    
    // CRITICAL: Use dev environment if configured (same as service requests)
    const devUrl = getDevApiUrl();
    const isUsingDev = isUsingDevEnvironment();
    
    // CRITICAL: Require dev environment - do NOT fall back to production
    if (!isUsingDev || !devUrl) {
      const errorMsg = 'Dev environment not configured. Please set NEXT_PUBLIC_DEV_API_URL to use dev backend.';
      console.error('❌ Production API disabled:', {
        reason: 'Production API usage is disabled for testing',
        requiredEnvVar: 'NEXT_PUBLIC_DEV_API_URL',
        action: 'Set NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai',
        note: 'Legacy NEXT_PUBLIC_SERVICE_REQUESTS_API_URL also supported for backward compatibility'
      });
      throw new Error(errorMsg);
    }
    
    const baseURL = devUrl.replace(/\/+$/, ''); // Remove trailing slash
    
    // Diagnostic logging to verify environment variables
    console.warn('🔍 ApprovedUserCredits API Request - ENVIRONMENT CHECK:', {
      environment: 'DEV',
      url,
      baseURL,
      fullUrl: `${baseURL}${url}`,
      envVars: {
        NEXT_PUBLIC_DEV_API_URL: process.env.NEXT_PUBLIC_DEV_API_URL || 'not set',
        NEXT_PUBLIC_SERVICE_REQUESTS_API_URL: process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL || 'not set'
      },
      resolvedDevUrl: devUrl,
      isUsingDev: true,
      cookieStatus: cookie ? 'found' : 'missing',
      reason: 'Using same environment as service requests to ensure data consistency'
    })
    
    // Use dev environment (already verified above)
    let response: any;
    try {
      console.warn('🔍 Creating serviceRequestsAxios instance...', {
        baseURL: devUrl,
        url,
        fullUrl: `${devUrl}${url}`
      });
      
      const serviceRequestsAPI = await createServiceRequestsAxios();
      
      console.warn('✅ Axios instance created, making GET request...', {
        url,
        baseURL: devUrl
      });
      
      response = await serviceRequestsAPI.get(url);
      
      console.warn('✅ API call successful:', {
        url,
        baseURL: devUrl,
        fullUrl: `${devUrl}${url}`,
        responseType: typeof response,
        hasStatus: 'Status' in (response || {}),
        status: response?.Status,
        hasData: !!response?.data || !!response?.Object,
        backend: 'DEV (gw5cndev.geowise.ai) ✅'
      });
    } catch (devErr: any) {
        // Enhanced error logging for dev environment
        const noResponse = !devErr.response;
        const hasRequest = !!devErr.request;
        const isNetworkError = devErr.code === 'ERR_NETWORK' || devErr.message === 'Network Error' || 
                               devErr.message?.includes('Network') || devErr.code === 'ECONNREFUSED';
        const isTimeout = devErr.code === 'ECONNABORTED' || devErr.message?.includes('timeout');
        
        // Log full error details
        console.error('❌ Dev environment API call failed - FULL ERROR DETAILS:', {
          url,
          baseURL: devUrl,
          fullUrl: `${devUrl}${url}`,
          errorCode: devErr.code,
          errorMessage: devErr.message,
          errorName: devErr.name,
          errorStack: devErr.stack?.substring(0, 500),
          hasResponse: !!devErr.response,
          hasRequest: !!devErr.request,
          responseStatus: devErr.response?.status,
          responseStatusText: devErr.response?.statusText,
          responseData: devErr.response?.data ? (typeof devErr.response.data === 'string' 
            ? devErr.response.data.substring(0, 500) 
            : JSON.stringify(devErr.response.data).substring(0, 500)) : 'none',
          requestConfig: devErr.config ? {
            method: devErr.config.method,
            url: devErr.config.url,
            baseURL: devErr.config.baseURL,
            headers: devErr.config.headers
          } : 'none',
          isNetworkError,
          isTimeout,
          noResponse
        });
        
        // Check if error is HTML response (from interceptor)
        const isHtmlError = devErr.message?.includes('HTML instead of JSON') || 
                            (devErr.response?.data && typeof devErr.response.data === 'string' && 
                             (devErr.response.data.includes('<html') || devErr.response.data.includes('<!DOCTYPE')));
        
        // Dev backend failed - do NOT fallback to production
        // This ensures we only use dev environment for testing
        let errorMessage: string;
        if (isHtmlError) {
          // Extract more details from the error message
          const htmlHint = devErr.message?.includes(':') ? devErr.message.split(':').slice(1).join(':').trim() : '';
          errorMessage = `Backend returned HTML instead of JSON. ${htmlHint || 'This usually indicates: 1) Authentication failed (cookie invalid/expired), 2) Endpoint not found, or 3) Server error. Please check server logs for the full HTML response.'}`;
        } else if (isNetworkError) {
          errorMessage = `Cannot connect to dev backend (${devUrl}). Please verify the backend is running and accessible.`;
        } else if (isTimeout) {
          errorMessage = `Request timeout: The dev backend (${devUrl}) took too long to respond.`;
        } else {
          errorMessage = `Dev backend error: ${devErr.message || 'Unknown error'}`;
        }
        
        console.error('❌ Dev backend unavailable - NOT falling back to production:', {
          devUrl,
          fullUrl: `${devUrl}${url}`,
          reason: 'Production fallback disabled to ensure dev-only testing',
          errorCode: devErr.code,
          errorMessage: devErr.message,
          isNetworkError,
          isTimeout,
          action: 'Please ensure dev backend is running and accessible',
          envCheck: {
            NEXT_PUBLIC_DEV_API_URL: process.env.NEXT_PUBLIC_DEV_API_URL || 'not set',
            NEXT_PUBLIC_SERVICE_REQUESTS_API_URL: process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL || 'not set',
            resolvedDevUrl: devUrl
          }
        });
        
        // Return error response instead of throwing
        return { 
          Status: 500, 
          Message: errorMessage, 
          data: [] 
        };
    }
    
    // Log the response type and first 500 chars for debugging
    let responsePreview = 'N/A';
    if (response !== undefined && response !== null) {
      if (typeof response === 'string') {
        responsePreview = response.substring(0, 500);
      } else {
        try {
          const stringified = JSON.stringify(response);
          responsePreview = stringified ? stringified.substring(0, 500) : 'Unable to stringify';
        } catch {
          responsePreview = 'Unable to parse response';
        }
      }
    }
    
    console.log('ApprovedUserCredits API Response:', {
      type: typeof response,
      isArray: Array.isArray(response),
      hasStatus: response?.Status !== undefined,
      hasData: response?.data !== undefined,
      hasObject: response?.Object !== undefined,
      preview: responsePreview
    })
    
    // Handle null or undefined response
    if (!response) {
      return { Status: 500, Message: 'Empty response from server', data: [] }
    }
    
    // Handle string responses (HTML error pages, plain text errors, etc.)
    if (typeof response === 'string') {
      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(response)
        // If it's a valid JSON object with Status, use it
        if (parsed.Status) {
          let message = parsed.Message || 
            (parsed.Status === 401 ? 'Unauthorized. Please check your authentication.' :
             parsed.Status === 403 ? 'Forbidden. You do not have permission to access this resource.' :
             parsed.Status === 404 ? 'Endpoint not found.' :
             parsed.Status === 500 ? 'Internal server error.' :
             'Request failed')
          
          // Check if it's a database/command execution error
          if (parsed.Message && (
            parsed.Message.includes('executing the command definition') ||
            parsed.Message.includes('Error retrieving ApprovedUserCredits')
          )) {
            message = 'Backend database error: ' + parsed.Message + ' The API endpoint is having trouble querying the database. Please contact the backend team.'
            console.error('ApprovedUserCredits: Backend database error (not authentication):', parsed.Message)
          }
          
          return { Status: parsed.Status, Message: message, data: [] }
        }
      } catch {
        // Not JSON, treat as error message
        // Check if it looks like HTML (redirect to login page or error page)
        if (response.includes('<html') || response.includes('<!DOCTYPE') || response.includes('login') || response.includes('Login')) {
          console.warn('Server redirected to login page - cookie may be invalid or expired')
          return { 
            Status: 401, 
            Message: 'Authentication required. Your session may have expired. Please log in again.', 
            data: [] 
          }
        }
        return { Status: 500, Message: `Server returned an error: ${response.substring(0, 200)}`, data: [] }
      }
    }
    
    // Handle different response formats
    if (Array.isArray(response)) {
      return { Status: 201, data: response }
    } else if (response.Data && Array.isArray(response.Data)) {
      // Handle "Data" with capital D (as shown in API response)
      return { Status: 201, data: response.Data }
    } else if (response.data && Array.isArray(response.data)) {
      return { Status: 201, data: response.data }
    } else if (response.items && Array.isArray(response.items)) {
      return { Status: 201, data: response.items }
    } else if (response.Status === 201 && response.Object) {
      // Handle if response has Status and Object
      const data = Array.isArray(response.Object) ? response.Object : []
      return { Status: 201, data }
             } else if (response.Status && response.Status !== 201) {
               // Handle error response with Status field (401, 403, 500, etc.)
               let message = response.Message || 
                 (response.Status === 401 ? 'Unauthorized. Please check your authentication.' :
                  response.Status === 403 ? 'Forbidden. You do not have permission to access this resource.' :
                  response.Status === 404 ? 'Endpoint not found.' :
                  response.Status === 500 ? 'Internal server error.' :
                  'Request failed')
               
               // Check if it's a database/command execution error (backend database issue, not auth)
               if (response.Message && (
                 response.Message.includes('executing the command definition') ||
                 response.Message.includes('Error retrieving ApprovedUserCredits')
               )) {
                 message = 'Backend database error: ' + response.Message + ' The API endpoint is having trouble querying the database. Please contact the backend team.'
                 // Log this as a backend issue, not auth
                 console.error('ApprovedUserCredits: Backend database error (not authentication):', response.Message)
               }
               
               return { Status: response.Status, Message: message, data: [] }
    } else {
      // Unknown response format - log for debugging
      // Safely stringify response for logging
      let responseStr = 'N/A';
      if (response !== undefined && response !== null) {
        if (typeof response === 'string') {
          responseStr = response.substring(0, 200);
        } else {
          try {
            const stringified = JSON.stringify(response, null, 2);
            responseStr = stringified || 'Unable to stringify';
          } catch {
            responseStr = 'Unable to parse response';
          }
        }
      }
      console.warn('Unexpected response format from ApprovedUserCredits API:', responseStr)
      return { Status: response.Status || 500, Message: response.Message || `Unexpected response format. Response type: ${typeof response}`, data: [] }
    }
  } catch (err: any) {
    // Enhanced error logging for debugging
    // Safely handle response data - JSON.stringify can return undefined
    let responseDataPreview = 'N/A';
    if (err.response?.data !== undefined) {
      if (typeof err.response.data === 'string') {
        responseDataPreview = err.response.data.substring(0, 500);
      } else {
        try {
          const stringified = JSON.stringify(err.response.data);
          responseDataPreview = stringified ? stringified.substring(0, 500) : 'Unable to stringify response';
        } catch {
          responseDataPreview = 'Unable to parse response data';
        }
      }
    }
    
    console.error('ApprovedUserCredits API Error:', {
      message: err.message,
      code: err.code,
      responseStatus: err.response?.status,
      responseStatusText: err.response?.statusText,
      responseData: responseDataPreview,
      requestUrl: err.config?.url,
      requestBaseURL: err.config?.baseURL,
      fullUrl: err.config ? `${err.config.baseURL}${err.config.url}` : 'unknown'
    })
    
    // Handle axios errors - check if it's a response error
    if (err.response) {
      const status = err.response.status || 500
      const responseData = err.response.data
      
      // If response is HTML, provide more context
      if (typeof responseData === 'string' && (responseData.includes('<html') || responseData.includes('<!DOCTYPE'))) {
        console.error('Server returned HTML error page. This usually means:', {
          status,
          possibleCauses: [
            'Endpoint does not exist (404)',
            'Authentication failed (401)',
            'Server error page (500)',
            'API base URL might be incorrect'
          ],
          actualBaseURL: getDevApiUrl() || 'unknown',
          requestedPath: err.config?.url || 'unknown'
        })
      }
      
      const message = responseData?.Message || responseData?.message || responseData?.error || err.response.statusText || 
        (status === 401 ? 'Unauthorized. Please check your authentication.' :
         status === 403 ? 'Forbidden. You do not have permission to access this resource.' :
         status === 404 ? 'Endpoint not found. Please verify the API endpoint is deployed.' :
         status === 500 ? 'Internal server error.' :
         'Request failed')
      return { Status: status, Message: message, data: [] }
    }
    // Handle axios errors without response (network errors, CORS, etc.)
    if (err.request && !err.response) {
    const isUsingDev = isUsingDevEnvironment();
    const devUrl = getDevApiUrl();
      const isNetworkError = err.code === 'ERR_NETWORK' || err.message === 'Network Error';
      const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
      
      console.error('Network error - no response received:', {
        message: err.message,
        code: err.code,
        environment: 'DEV',
        baseURL: devUrl,
        isNetworkError,
        isTimeout,
        possibleCauses: [
          'Backend server is not running',
          'CORS configuration issue (though CORS should be resolved)',
          'Network connectivity problem',
          'SSL certificate issue (if using HTTPS)',
          'Firewall blocking the request'
        ]
      });
      
      let errorMessage = 'Network error. Please check your connection.';
      if (isUsingDev && devUrl) {
        errorMessage = `Cannot connect to dev backend (${devUrl}). Please verify the backend is running and accessible.`;
      } else if (isTimeout) {
        errorMessage = 'Request timed out. The backend may be slow or unresponsive.';
      }
      
      return { Status: 500, Message: errorMessage, data: [] }
    }
    // Handle other errors
    const errorMessage = err.message || 'Failed to load credits'
    return { Status: 500, Message: errorMessage, data: [] }
  }
}

/**
 * Get ApprovedUserCredits for the current user (from session)
 */
export async function getApprovedUserCreditsByUserId(): Promise<{ Status: number; Message?: string; data?: ApprovedUserCredit[] }> {
  try {
    if (!isUsingDevEnvironment()) {
      throw new Error('Dev environment not configured. Please set NEXT_PUBLIC_DEV_API_URL');
    }
    const serviceRequestsAPI = await createServiceRequestsAxios();
    const response: any = await serviceRequestsAPI.get('/ApprovedUserCredits/GetByUserId')
    
    if (Array.isArray(response)) {
      return { Status: 201, data: response }
    } else if (response.data && Array.isArray(response.data)) {
      return { Status: 201, data: response.data }
    } else if (response.Status === 201 && response.Object) {
      const data = Array.isArray(response.Object) ? response.Object : []
      return { Status: 201, data }
    } else {
      return { Status: response.Status || 500, Message: response.Message || 'Unexpected response format', data: [] }
    }
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message
    return { Status: 500, Message: errorMessage, data: [] }
  }
}

/**
 * Create a new ApprovedUserCredit record
 * POST /ApprovedUserCredits/add
 * Uses DEV environment if NEXT_PUBLIC_SERVICE_REQUESTS_API_URL is set
 * This ensures credits are created in the same environment as service requests
 */
export async function createApprovedUserCredit(
  data: Omit<ApprovedUserCredit, 'Id'>
): Promise<{ Status: number; Message?: string; data?: ApprovedUserCredit }> {
  try {
    // Use dev environment if configured (same as listApprovedUserCredits)
    const isUsingDev = isUsingDevEnvironment();
    const devUrl = getDevApiUrl();
    const baseURL = devUrl || 'unknown';
    
    console.warn('🔍 Creating ApprovedUserCredit:', {
      environment: 'DEV',
      apiUrl: baseURL,
      fullUrl: `${baseURL}/ApprovedUserCredits/add`,
      userId: data.UserId,
      serviceId: data.ServiceId,
      approvedCredits: data.ApprovedCredits,
      envVars: {
        NEXT_PUBLIC_DEV_API_URL: process.env.NEXT_PUBLIC_DEV_API_URL || 'not set',
        NEXT_PUBLIC_SERVICE_REQUESTS_API_URL: process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL || 'not set',
      },
      reason: 'Using same environment as service requests to ensure data consistency'
    });
    
    if (!isUsingDev) {
      throw new Error('Dev environment not configured. Please set NEXT_PUBLIC_DEV_API_URL');
    }
    const serviceRequestsAPI = await createServiceRequestsAxios();
    const response: any = await serviceRequestsAPI.post('/ApprovedUserCredits/add', data);
    
    if (response.Status === 201) {
      console.log('✅ ApprovedUserCredit created successfully in DEV');
      return { 
        Status: 201, 
        Message: response.Message || 'ApprovedUserCredit created successfully',
        data: response.Object || response.data || response
      }
    } else {
      return { 
        Status: response.Status || 500, 
        Message: response.Message || 'Failed to create ApprovedUserCredit'
      }
    }
  } catch (err: any) {
    console.error('❌ Failed to create ApprovedUserCredit:', {
      error: err.message,
      status: err.response?.status,
      responseData: err.response?.data
    });
    const errorMessage = err.response?.statusText || err.message || 'Failed to create ApprovedUserCredit'
    return { Status: 500, Message: errorMessage }
  }
}

/**
 * Update an existing ApprovedUserCredit record
 * POST /ApprovedUserCredits/Update
 * Uses DEV environment if NEXT_PUBLIC_SERVICE_REQUESTS_API_URL is set
 * This ensures credits are updated in the same environment as service requests
 */
export async function updateApprovedUserCredit(
  data: ApprovedUserCredit
): Promise<{ Status: number; Message?: string; data?: ApprovedUserCredit }> {
  try {
    // Use dev environment if configured (same as listApprovedUserCredits)
    const isUsingDev = isUsingDevEnvironment();
    const devUrl = getDevApiUrl();
    const baseURL = devUrl || 'unknown';
    
    console.warn('🔍 Updating ApprovedUserCredit:', {
      environment: 'DEV',
      apiUrl: baseURL,
      fullUrl: `${baseURL}/ApprovedUserCredits/Update`,
      creditId: data.Id,
      userId: data.UserId,
      serviceId: data.ServiceId,
      remainingCredits: data.RemainingCredits,
      envVars: {
        NEXT_PUBLIC_DEV_API_URL: process.env.NEXT_PUBLIC_DEV_API_URL || 'not set',
        NEXT_PUBLIC_SERVICE_REQUESTS_API_URL: process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL || 'not set',
      },
      reason: 'Using same environment as service requests to ensure data consistency'
    });
    
    if (!isUsingDev) {
      throw new Error('Dev environment not configured. Please set NEXT_PUBLIC_DEV_API_URL');
    }
    const serviceRequestsAPI = await createServiceRequestsAxios();
    const response: any = await serviceRequestsAPI.post('/ApprovedUserCredits/Update', data);
    
    if (response.Status === 201) {
      console.log('✅ ApprovedUserCredit updated successfully in', isUsingDev ? 'DEV' : 'PRODUCTION');
      return { 
        Status: 201, 
        Message: response.Message || 'ApprovedUserCredit updated successfully',
        data: response.Object || response.data || response
      }
    } else {
      return { 
        Status: response.Status || 500, 
        Message: response.Message || 'Failed to update ApprovedUserCredit'
      }
    }
  } catch (err: any) {
    console.error('❌ Failed to update ApprovedUserCredit:', {
      error: err.message,
      status: err.response?.status,
      responseData: err.response?.data
    });
    const errorMessage = err.response?.statusText || err.message || 'Failed to update ApprovedUserCredit'
    return { Status: 500, Message: errorMessage }
  }
}

/**
 * Delete ApprovedUserCredit (soft delete by setting IsActive to false)
 * POST /ApprovedUserCredits/Delete?id={id}
 * Uses DEV environment if NEXT_PUBLIC_SERVICE_REQUESTS_API_URL is set
 */
export async function deleteApprovedUserCredit(
  id: number
): Promise<{ Status: number; Message?: string }> {
  try {
    // Use dev environment if configured (same as listApprovedUserCredits)
    const isUsingDev = isUsingDevEnvironment();
    const devUrl = getDevApiUrl();
    
    console.warn('🔍 Deleting ApprovedUserCredit:', {
      environment: isUsingDev ? 'DEV' : 'PRODUCTION',
      apiUrl: devUrl || 'unknown',
      fullUrl: `${devUrl || 'unknown'}/ApprovedUserCredits/Delete?id=${id}`,
      creditId: id,
      envVars: {
        NEXT_PUBLIC_DEV_API_URL: process.env.NEXT_PUBLIC_DEV_API_URL || 'not set',
        NEXT_PUBLIC_SERVICE_REQUESTS_API_URL: process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL || 'not set',
      }
    });
    
    if (!isUsingDev) {
      throw new Error('Dev environment not configured. Please set NEXT_PUBLIC_DEV_API_URL');
    }
    const serviceRequestsAPI = await createServiceRequestsAxios();
    const response: any = await serviceRequestsAPI.post(`/ApprovedUserCredits/Delete?id=${id}`);
    
    if (response.Status === 201) {
      return { 
        Status: 201, 
        Message: response.Message || 'ApprovedUserCredit deleted successfully'
      }
    } else {
      return { 
        Status: response.Status || 500, 
        Message: response.Message || 'Failed to delete ApprovedUserCredit'
      }
    }
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message || 'Failed to delete ApprovedUserCredit'
    return { Status: 500, Message: errorMessage }
  }
}

/**
 * Get ApprovedUserCredit by ID
 * GET /ApprovedUserCredits/GetById?id={id}
 * Response includes UserName, UserEmail, ServiceName
 * Uses DEV environment if NEXT_PUBLIC_SERVICE_REQUESTS_API_URL is set
 */
export async function getApprovedUserCreditById(
  id: number
): Promise<{ Status: number; Message?: string; data?: ApprovedUserCredit & { UserName?: string; UserEmail?: string; ServiceName?: string } }> {
  try {
    // Use dev environment if configured
    const isUsingDev = !!process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL;
    
    if (!isUsingDev) {
      throw new Error('Dev environment not configured. Please set NEXT_PUBLIC_SERVICE_REQUESTS_API_URL');
    }
    const serviceRequestsAPI = await createServiceRequestsAxios();
    const response: any = await serviceRequestsAPI.get(`/ApprovedUserCredits/GetById?id=${id}`);
    
    if (response.Status === 201 || response.Id) {
      return { 
        Status: 201, 
        data: response.Object || response.data || response
      }
    } else {
      return { 
        Status: response.Status || 500, 
        Message: response.Message || 'ApprovedUserCredit not found'
      }
    }
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message || 'Failed to get ApprovedUserCredit'
    return { Status: 500, Message: errorMessage }
  }
}

/**
 * Import ApprovedUserCredits from a file (bulk import)
 * POST /ApprovedUserCredits/import
 * Content-Type: multipart/form-data
 * Form-data key: file
 * 
 * @param formData - FormData object containing the file with key 'file'
 *                   Client should create: formData.append('file', file)
 */
export async function importApprovedUserCredits(
  formData: FormData
): Promise<{ Status: number; Message?: string; data?: { success: number; errors?: string[] } }> {
  try {
    if (!isUsingDevEnvironment()) {
      throw new Error('Dev environment not configured. Please set NEXT_PUBLIC_DEV_API_URL');
    }
    const serviceRequestsAPI = await createServiceRequestsAxios();
    const response: any = await serviceRequestsAPI.post(
      '/ApprovedUserCredits/import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    
    if (response.Status === 201) {
      return { 
        Status: 201, 
        Message: response.Message || 'Import completed successfully',
        data: response.Object || response.data || response
      }
    } else {
      return { 
        Status: response.Status || 500, 
        Message: response.Message || 'Import failed',
        data: response.Object || response.data
      }
    }
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message || 'Failed to import ApprovedUserCredits'
    return { Status: 500, Message: errorMessage }
  }
}

/**
 * Export ApprovedUserCredits data
 * POST /ApprovedUserCredits/Export
 * Returns file download (arraybuffer)
 */
export async function exportApprovedUserCredits(): Promise<{ Status: number; Message?: string; blob?: Blob }> {
  try {
    if (!isUsingDevEnvironment()) {
      throw new Error('Dev environment not configured. Please set NEXT_PUBLIC_DEV_API_URL');
    }
    const serviceRequestsAPI = await createServiceRequestsAxios();
    const response: any = await serviceRequestsAPI.post(
      '/ApprovedUserCredits/Export',
      {},
      {
        responseType: 'arraybuffer',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json'
        }
      }
    )
    
    // If response is already a Blob or ArrayBuffer, return it
    if (response instanceof Blob) {
      return { Status: 201, blob: response }
    }
    
    if (response instanceof ArrayBuffer) {
      return { Status: 201, blob: new Blob([response]) }
    }
    
    // Handle JSON response (error case)
    if (response.Status && response.Status !== 201) {
      return { 
        Status: response.Status || 500, 
        Message: response.Message || 'Export failed'
      }
    }
    
    // Default: treat as successful blob
    return { Status: 201, blob: new Blob([response]) }
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message || 'Failed to export ApprovedUserCredits'
    return { Status: 500, Message: errorMessage, blob: new Blob() }
  }
}

/**
 * Generate bookings from imported service requests and user credits
 * POST /ApprovedUserCredits/GenerateBookings
 * 
 * This endpoint picks up records from imported records and user credits table,
 * and starts generating bookings based on available credits.
 * 
 * ⚠️ WARNING: Use this endpoint carefully. Prepare data only with test customers/services
 * so importing files should not have impact over production data.
 * 
 * @param creditIds - Array of ApprovedUserCredit IDs to use for booking generation
 *                    Only credits with remaining credits will be used
 * 
 * @returns Response with Status, Message, and data containing success/error counts
 */
export async function generateBookings(
  creditIds: number[]
): Promise<{ 
  Status: number; 
  Message?: string; 
  data?: { 
    success?: number; 
    errors?: string[];
    totalProcessed?: number;
    bookingsCreated?: number;
    ErrorLogs?: string[];
  } 
}> {
  try {
    if (!creditIds || creditIds.length === 0) {
      return { 
        Status: 400, 
        Message: 'At least one credit ID is required' 
      }
    }

    console.log('Calling GenerateBookings API (Auto-Dispatch) with credit IDs:', creditIds)
    
    // CRITICAL: Check authentication cookie before making request
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('xyzCompAuthorize');
    
    if (!authCookie || !authCookie.value) {
      const errorMsg = 'Authentication required. Please log in again. Your session may have expired.';
      console.error('❌ GenerateBookings: Authentication cookie missing:', {
        hasCookie: !!authCookie,
        hasValue: !!authCookie?.value,
        allCookies: cookieStore.getAll().map(c => ({ name: c.name, hasValue: !!c.value })),
        action: 'User needs to log in again'
      });
      return {
        Status: 401,
        Message: errorMsg,
        data: undefined
      };
    }
    
    console.log('✅ GenerateBookings: Authentication cookie found:', {
      hasCookie: !!authCookie,
      hasValue: !!authCookie.value,
      cookieLength: authCookie.value?.length || 0,
      cookiePreview: authCookie.value ? `${authCookie.value.substring(0, 30)}...` : 'none'
    });
    
    // Use service requests axios instance (supports dev environment)
    // This ensures auto-dispatch uses the same dev environment as service requests import
    const serviceRequestsAPI = await createServiceRequestsAxios()
    const isUsingDev = !!process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL
    console.log('🔧 Auto-Dispatch using Service Requests API URL (dev environment if configured)')
    
    // CRITICAL: Log where bookings will be created
    // Note: Dev environment is for testing, but data should be treated as REAL (realistic locations, real data structure)
    console.warn('⚠️ AUTO-DISPATCH DATA STORAGE LOCATION:', {
      environment: 'DEV (Testing Environment)',
      message: '✅ Bookings will be created on DEV environment (testing database, but data is REAL and realistic)',
      devUrl: getDevApiUrl() || 'not set',
      note: 'Dev environment uses separate database for testing, but data structure and locations are realistic'
    })
    
    // Add timeout to prevent hanging (60 seconds for booking generation)
    const requestStartTime = Date.now()
    let response: any
    
    try {
      response = await Promise.race([
        serviceRequestsAPI.post('/ApprovedUserCredits/GenerateBookings', {
          CreditIds: creditIds
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 60 seconds')), 60000)
        )
      ]) as any
      
      const requestDuration = Date.now() - requestStartTime
      console.log(`✅ GenerateBookings API request completed in ${requestDuration}ms`)
      
      // Log full response structure for debugging
      // Check if response is an object before using 'in' operator
      const isResponseObject = response && typeof response === 'object' && !Array.isArray(response)
      
      // Safely stringify response for logging
      let responseStr = 'N/A';
      if (response !== undefined && response !== null) {
        try {
          const stringified = JSON.stringify(response, null, 2);
          responseStr = stringified || 'Unable to stringify';
        } catch {
          responseStr = 'Unable to parse response';
        }
      }
      console.log('📥 GenerateBookings API response (full):', responseStr)
      
      // Safely get response value preview
      let responseValuePreview = 'N/A';
      if (response !== undefined && response !== null) {
        if (typeof response === 'string') {
          responseValuePreview = response.substring(0, 200);
        } else if (isResponseObject) {
          responseValuePreview = 'object';
        } else {
          try {
            responseValuePreview = String(response);
          } catch {
            responseValuePreview = 'Unable to convert to string';
          }
        }
      }
      
      console.log('📥 GenerateBookings API response (summary):', {
        responseType: typeof response,
        isObject: isResponseObject,
        isArray: Array.isArray(response),
        isNull: response === null,
        isUndefined: response === undefined,
        Status: isResponseObject ? response.Status : undefined,
        status: isResponseObject ? response.status : undefined,
        Message: isResponseObject ? response.Message : undefined,
        message: isResponseObject ? response.message : undefined,
        hasData: isResponseObject ? !!response.data : false,
        hasObject: isResponseObject ? !!response.Object : false,
        dataType: isResponseObject ? typeof response.data : typeof response,
        objectType: isResponseObject ? typeof response.Object : 'N/A',
        responseKeys: isResponseObject ? Object.keys(response) : [],
        responseValue: responseValuePreview,
        responseStructure: {
          hasStatus: isResponseObject ? ('Status' in response || 'status' in response) : false,
          hasMessage: isResponseObject ? ('Message' in response || 'message' in response) : false,
          hasData: isResponseObject ? ('data' in response) : false,
          hasObject: isResponseObject ? ('Object' in response) : false
        }
      })
    } catch (requestError: any) {
      const requestDuration = Date.now() - requestStartTime
      console.error(`❌ GenerateBookings API request failed after ${requestDuration}ms`)
      throw requestError // Re-throw to be caught by outer catch block
    }
    
    // Handle different response formats
    // Backend might return: { Status: 201, Message: "...", Object: {...} }
    // Or: { status: 201, message: "...", data: {...} }
    // Or: { success: true, data: {...} }
    // Or: string, null, undefined (error cases)
    const isResponseObject = response && typeof response === 'object' && !Array.isArray(response)
    
    if (!isResponseObject) {
      // Response is not an object (string, null, undefined, etc.)
      // Safely convert response to string for logging
      let responseValueStr = 'N/A';
      if (response !== undefined && response !== null) {
        if (typeof response === 'string') {
          responseValueStr = response.substring(0, 500);
        } else {
          try {
            responseValueStr = String(response);
          } catch {
            responseValueStr = 'Unable to convert to string';
          }
        }
      }
      
      console.error('❌ GenerateBookings API returned non-object response:', {
        responseType: typeof response,
        responseValue: responseValueStr,
        note: 'Backend may have returned an error message as a string or empty response'
      })
      
      return {
        Status: 500,
        Message: typeof response === 'string' ? response : 'Backend returned an invalid response format',
        data: undefined
      }
    }
    
    const responseStatus = response.Status || response.status || (response.success ? 201 : 500)
    const responseMessage = response.Message || response.message || (response.success ? 'Bookings generated successfully' : 'Failed to generate bookings')
    const responseData = response.Object || response.data || response
    
    console.log('📊 Processing GenerateBookings response:', {
      responseStatus,
      responseMessage,
      hasData: !!responseData,
      dataType: typeof responseData,
      isSuccess: responseStatus === 201
    })
    
    // Handle 401 Unauthorized in response
    if (responseStatus === 401) {
      const authErrorMessage = 'Authentication failed. Your session may have expired. Please log out and log back in, then try again.';
      console.error('❌ GenerateBookings: API returned 401 Unauthorized:', {
        responseStatus,
        responseMessage,
        responseData,
        action: 'User should log out and log back in'
      });
      return {
        Status: 401,
        Message: authErrorMessage,
        data: responseData
      };
    }
    
    if (responseStatus === 201 || responseStatus === 200) {
      return { 
        Status: 201, 
        Message: responseMessage,
        data: responseData
      }
    } else {
      // Even if status is not 201, return the response so the caller can see the error details
      return { 
        Status: responseStatus, 
        Message: responseMessage,
        data: responseData
      }
    }
  } catch (err: any) {
    // Enhanced error logging to help debug the issue
    const baseURL = process.env.NEXT_PUBLIC_DEV_API_URL || process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL || 'unknown'
    const endpoint = '/ApprovedUserCredits/GenerateBookings'
    const fullUrl = `${baseURL}${endpoint}`
    
    console.error('❌ GenerateBookings API Error:', {
      message: err.message,
      name: err.name,
      code: err.code,
      status: err.response?.status,
      statusText: err.response?.statusText,
      responseData: err.response?.data,
      requestUrl: fullUrl,
      baseURL: baseURL,
      endpoint: endpoint,
      creditIds: creditIds,
      isTimeout: err.code === 'ECONNABORTED' || err.message?.includes('timeout'),
      isNetworkError: err.code === 'ERR_NETWORK' || err.message === 'Network Error',
      isServerError: err.response?.status >= 500,
      isClientError: err.response?.status >= 400 && err.response?.status < 500,
      errorDetails: {
        stack: err.stack,
        config: err.config ? {
          url: err.config.url,
          method: err.config.method,
          baseURL: err.config.baseURL,
          timeout: err.config.timeout
        } : undefined
      }
    })
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Failed to generate bookings'
    
    // Handle 401 Unauthorized errors specifically
    if (err.response?.status === 401) {
      errorMessage = 'Authentication failed. Your session may have expired. Please log out and log back in, then try again.';
      console.error('❌ GenerateBookings: 401 Unauthorized - Authentication failed:', {
        status: 401,
        responseData: err.response?.data,
        possibleCauses: [
          'Session expired - user needs to log in again',
          'Cookie not being sent correctly',
          'Cookie invalid or corrupted',
          'Backend authentication service unavailable'
        ],
        action: 'User should log out and log back in'
      });
    } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      errorMessage = 'Request timed out. The server may be processing. Please try again or check server logs.'
    } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      errorMessage = `Cannot connect to backend (${baseURL}). Please verify the backend is running and accessible.`
    } else if (err.response?.status === 404) {
      errorMessage = `Endpoint not found: ${endpoint}. Please verify the backend endpoint path.`
    } else if (err.response?.status === 403) {
      errorMessage = 'Access forbidden. You do not have permission to perform this action.'
    } else if (err.response?.status >= 500) {
      errorMessage = `Server error (${err.response?.status}): ${err.response?.statusText || 'Internal server error'}. Please check backend logs.`
    } else if (err.response?.status >= 400) {
      errorMessage = `Client error (${err.response?.status}): ${err.response?.statusText || err.response?.data?.Message || 'Bad request'}`
    } else if (err.response?.data?.Message) {
      errorMessage = err.response.data.Message
    } else if (err.response?.statusText) {
      errorMessage = err.response.statusText
    } else if (err.message) {
      errorMessage = err.message
    }
    
    // Include response data if available for debugging
    const errorData = err.response?.data || (err.response ? { status: err.response.status, statusText: err.response.statusText } : undefined)
    
    return { 
      Status: err.response?.status || 500, 
      Message: errorMessage,
      data: errorData
    }
  }
}