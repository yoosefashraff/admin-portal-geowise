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
/**
 * Process a single batch of credit IDs (for Netlify timeout compliance)
 * Netlify has a 26-second limit, so we use 20-second timeout per batch
 */
async function generateBookingsBatch(
  creditIds: number[],
  serviceRequestsAPI: any,
  batchNumber: number,
  totalBatches: number
): Promise<{ 
  Status: number; 
  Message?: string; 
  data?: any;
}> {
  const batchStartTime = Date.now()
  const timeoutMs = 20000 // 20 seconds per batch (under Netlify's 26s limit)
  
  console.log(`📦 Processing batch ${batchNumber}/${totalBatches} with ${creditIds.length} credit ID(s):`, creditIds)
  
  try {
    const response = await Promise.race([
      serviceRequestsAPI.post('/ApprovedUserCredits/GenerateBookings', {
        CreditIds: creditIds
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Batch ${batchNumber} timeout after ${timeoutMs/1000} seconds`)), timeoutMs)
      )
    ]) as any
    
    const batchDuration = Date.now() - batchStartTime
    console.log(`✅ Batch ${batchNumber}/${totalBatches} completed in ${batchDuration}ms (${(batchDuration / 1000).toFixed(1)}s)`)
    
    const isResponseObject = response && typeof response === 'object' && !Array.isArray(response)
    if (!isResponseObject) {
      return {
        Status: 500,
        Message: `Batch ${batchNumber} returned invalid response format`,
        data: undefined
      }
    }
    
    const responseStatus = response.Status || response.status || (response.success ? 201 : 500)
    const responseMessage = response.Message || response.message || 'Batch processed'
    const responseData = response.Object || response.data || response
    
    return {
      Status: responseStatus,
      Message: responseMessage,
      data: responseData
    }
  } catch (err: any) {
    const batchDuration = Date.now() - batchStartTime
    console.error(`❌ Batch ${batchNumber}/${totalBatches} failed after ${batchDuration}ms:`, err.message)
    
    return {
      Status: err.response?.status || 500,
      Message: `Batch ${batchNumber} failed: ${err.message}`,
      data: err.response?.data
    }
  }
}

/**
 * Generate bookings from credit IDs
 * Automatically batches large requests to comply with Netlify's 26-second timeout limit
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

    // Netlify timeout workaround: batch processing
    // Netlify has a 26-second limit, so we process in batches of 3-5 credit IDs
    // with a 20-second timeout per batch to stay safely under the limit
    const BATCH_SIZE = 3 // Conservative: 3 credit IDs per batch
    const shouldBatch = creditIds.length > BATCH_SIZE
    
    console.log('Calling GenerateBookings API (Auto-Dispatch) with credit IDs:', {
      totalCreditIds: creditIds.length,
      creditIds: creditIds,
      willBatch: shouldBatch,
      batchSize: shouldBatch ? BATCH_SIZE : 'N/A (single request)',
      reason: shouldBatch ? 'Netlify 26-second timeout limit' : 'Small enough for single request'
    })
    
    // CRITICAL: Check authentication cookie before making request
    const { cookies } = await import('next/headers');
    let cookieStore;
    let authCookie;
    let allCookies;
    
    try {
      cookieStore = await cookies();
      authCookie = cookieStore.get('xyzCompAuthorize');
      allCookies = cookieStore.getAll();
    } catch (cookieError: any) {
      const errorMsg = 'Failed to read authentication cookie. Please log out and log back in.';
      console.error('❌ GenerateBookings: Error reading cookies:', {
        error: cookieError.message,
        errorName: cookieError.name,
        action: 'User needs to log in again'
      });
      return {
        Status: 401,
        Message: errorMsg,
        data: undefined
      };
    }
    
    if (!authCookie || !authCookie.value) {
      const errorMsg = 'Authentication required. Please log out and log back in. Your session may have expired.';
      console.error('❌ GenerateBookings: Authentication cookie missing:', {
        hasCookie: !!authCookie,
        hasValue: !!authCookie?.value,
        allCookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value, valueLength: c.value?.length || 0 })),
        cookieCount: allCookies.length,
        cookieNames: allCookies.map(c => c.name),
        action: 'User needs to log out and log back in'
      });
      return {
        Status: 401,
        Message: errorMsg,
        data: undefined
      };
    }
    
    // Validate cookie value is not empty or just whitespace
    if (!authCookie.value.trim()) {
      const errorMsg = 'Authentication cookie is empty. Please log out and log back in.';
      console.error('❌ GenerateBookings: Authentication cookie is empty:', {
        cookieLength: authCookie.value.length,
        allCookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
        action: 'User needs to log out and log back in'
      });
      return {
        Status: 401,
        Message: errorMsg,
        data: undefined
      };
    }
    
    // Validate cookie format (should be a non-empty string)
    if (authCookie.value.length < 10) {
      const errorMsg = 'Authentication cookie appears invalid. Please log out and log back in.';
      console.error('❌ GenerateBookings: Cookie seems too short (possibly invalid):', {
        cookieLength: authCookie.value.length,
        cookiePreview: authCookie.value.substring(0, 20),
        action: 'User needs to log out and log back in'
      });
      return {
        Status: 401,
        Message: errorMsg,
        data: undefined
      };
    }
    
    console.log('✅ GenerateBookings: Authentication cookie validated:', {
      hasCookie: !!authCookie,
      hasValue: !!authCookie.value,
      cookieLength: authCookie.value?.length || 0,
      cookiePreview: authCookie.value ? `${authCookie.value.substring(0, 30)}...` : 'none',
      allCookiesCount: allCookies.length,
      cookieNames: allCookies.map(c => c.name)
    });
    
    const isUsingDev = !!process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL
    console.log('🔧 Auto-Dispatch using Service Requests API URL (dev environment if configured)')
    
    // CRITICAL: Log where bookings will be created
    console.warn('⚠️ AUTO-DISPATCH DATA STORAGE LOCATION:', {
      environment: 'DEV (Testing Environment)',
      message: '✅ Bookings will be created on DEV environment (testing database, but data is REAL and realistic)',
      devUrl: getDevApiUrl() || 'not set',
      note: 'Dev environment uses separate database for testing, but data structure and locations are realistic'
    })
    
    // Use service requests axios instance (supports dev environment)
    const serviceRequestsAPI = await createServiceRequestsAxios()
    
    // Verify cookie is still available
    const cookieStoreBeforeRequest = await cookies();
    const authCookieBeforeRequest = cookieStoreBeforeRequest.get('xyzCompAuthorize');
    if (!authCookieBeforeRequest || !authCookieBeforeRequest.value) {
      const errorMsg = 'Authentication cookie lost before request. Please log in again.';
      console.error('❌ GenerateBookings: Cookie disappeared before request')
      return {
        Status: 401,
        Message: errorMsg,
        data: undefined
      };
    }
    
    const requestStartTime = Date.now()
    let response: any
    
    try {
      // Log exactly what we're sending to the backend
      console.log('📤 GenerateBookings Request Details:', {
        creditIdsCount: creditIds.length,
        creditIds: creditIds,
        endpoint: '/ApprovedUserCredits/GenerateBookings',
        timeout: shouldBatch ? `20 seconds per batch (${Math.ceil(creditIds.length / BATCH_SIZE)} batches)` : '20 seconds',
        backendUrl: getDevApiUrl() || 'unknown',
        purpose: 'Converting pending service requests to bookings via auto-dispatch',
        netlifyCompliance: shouldBatch ? '✅ Using batching to comply with Netlify 26s limit' : '✅ Single request under limit',
        important: 'This endpoint should ONLY be called when user explicitly runs auto-dispatch. Import should NOT trigger this.'
      })
      
      if (shouldBatch) {
        // BATCH PROCESSING: Split into smaller batches
        const batches: number[][] = []
        for (let i = 0; i < creditIds.length; i += BATCH_SIZE) {
          batches.push(creditIds.slice(i, i + BATCH_SIZE))
        }
        
        console.log(`🔄 Processing ${batches.length} batch(es) to comply with Netlify timeout limit`)
        
        const batchResults: Array<{ Status: number; Message?: string; data?: any }> = []
        let totalBookingsCreated = 0
        let totalProcessed = 0
        const allErrors: string[] = []
        const allErrorLogs: string[] = []
        
        // Process batches sequentially
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i]
          const batchResult = await generateBookingsBatch(
            batch,
            serviceRequestsAPI,
            i + 1,
            batches.length
          )
          
          batchResults.push(batchResult)
          
          // Aggregate results
          if (batchResult.Status === 201 || batchResult.Status === 200) {
            const batchData = batchResult.data || {}
            totalBookingsCreated += batchData.bookingsCreated || batchData.success || 0
            totalProcessed += batchData.totalProcessed || batch.length
          } else {
            // Collect errors
            if (batchResult.Message) {
              allErrors.push(`Batch ${i + 1}: ${batchResult.Message}`)
            }
            if (batchResult.data?.ErrorLogs) {
              allErrorLogs.push(...(Array.isArray(batchResult.data.ErrorLogs) ? batchResult.data.ErrorLogs : [batchResult.data.ErrorLogs]))
            }
            if (batchResult.data?.errors) {
              allErrors.push(...(Array.isArray(batchResult.data.errors) ? batchResult.data.errors : [batchResult.data.errors]))
            }
          }
        }
        
        // Determine overall status
        const successCount = batchResults.filter(r => r.Status === 201 || r.Status === 200).length
        const failedCount = batches.length - successCount
        
        const requestDuration = Date.now() - requestStartTime
        console.log(`✅ GenerateBookings (batched) completed in ${requestDuration}ms (${(requestDuration / 1000).toFixed(1)}s)`, {
          totalBatches: batches.length,
          successfulBatches: successCount,
          failedBatches: failedCount,
          totalBookingsCreated,
          totalProcessed
        })
        
        // Return aggregated response
        if (successCount === batches.length) {
          // All batches succeeded
          response = {
            Status: 201,
            Message: `Successfully processed ${batches.length} batch(es). ${totalBookingsCreated} booking(s) created.`,
            Object: {
              success: totalBookingsCreated,
              totalProcessed,
              bookingsCreated: totalBookingsCreated,
              batchesProcessed: batches.length,
              batchesSuccessful: successCount
            }
          }
        } else if (successCount > 0) {
          // Partial success
          response = {
            Status: 207, // Multi-Status
            Message: `Partially successful: ${successCount}/${batches.length} batch(es) succeeded. ${totalBookingsCreated} booking(s) created. Some batches failed.`,
            Object: {
              success: totalBookingsCreated,
              totalProcessed,
              bookingsCreated: totalBookingsCreated,
              batchesProcessed: batches.length,
              batchesSuccessful: successCount,
              batchesFailed: failedCount,
              errors: allErrors,
              ErrorLogs: allErrorLogs
            }
          }
        } else {
          // All batches failed
          response = {
            Status: 500,
            Message: `All ${batches.length} batch(es) failed. No bookings created.`,
            Object: {
              success: 0,
              totalProcessed: 0,
              bookingsCreated: 0,
              batchesProcessed: batches.length,
              batchesSuccessful: 0,
              batchesFailed: failedCount,
              errors: allErrors,
              ErrorLogs: allErrorLogs
            }
          }
        }
      } else {
        // SINGLE REQUEST: Process all credit IDs at once (small batch)
        const batchResult = await generateBookingsBatch(
          creditIds,
          serviceRequestsAPI,
          1,
          1
        )
        
        const requestDuration = Date.now() - requestStartTime
        console.log(`✅ GenerateBookings (single request) completed in ${requestDuration}ms (${(requestDuration / 1000).toFixed(1)}s)`)
        
        response = batchResult
      }
      
      // Log response summary
      const isResponseObject = response && typeof response === 'object' && !Array.isArray(response)
      console.log('📥 GenerateBookings API response (summary):', {
        responseType: typeof response,
        isObject: isResponseObject,
        Status: isResponseObject ? response.Status : undefined,
        Message: isResponseObject ? response.Message : undefined,
        hasData: isResponseObject ? !!(response.Object || response.data) : false
      })
    } catch (requestError: any) {
      const requestDuration = Date.now() - requestStartTime
      console.error(`❌ GenerateBookings API request failed after ${requestDuration}ms`)
      throw requestError // Re-throw to be caught by outer catch block
    }
    
    // Handle response format (batched responses already have Status/Message/data structure)
    const isResponseObject = response && typeof response === 'object' && !Array.isArray(response)
    
    if (!isResponseObject) {
      console.error('❌ GenerateBookings API returned non-object response:', {
        responseType: typeof response,
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
      isSuccess: responseStatus === 201 || responseStatus === 207 // 207 = Multi-Status (partial success)
    })
    
    // Handle 401 Unauthorized in response
    if (responseStatus === 401) {
      // Re-check cookie status when 401 occurs in response
      const cookieStoreOnResponse = await cookies();
      const authCookieOnResponse = cookieStoreOnResponse.get('xyzCompAuthorize');
      const allCookiesOnResponse = cookieStoreOnResponse.getAll();
      
      // Clean up backend error message - remove redundant "Error : ." prefix
      let cleanBackendMessage = responseMessage?.trim() || '';
      if (cleanBackendMessage.startsWith('Error :')) {
        cleanBackendMessage = cleanBackendMessage.replace(/^Error\s*:\s*\.?\s*/, '').trim();
      }
      
      const authErrorMessage = cleanBackendMessage && cleanBackendMessage !== 'Please contact the helpdesk.'
        ? `Authentication failed: ${cleanBackendMessage}. Please log out and log back in, then try again.`
        : 'Authentication failed. Your session may have expired. Please log out and log back in, then try again.';
      
      console.error('❌ GenerateBookings: API returned 401 Unauthorized:', {
        responseStatus,
        responseMessage,
        responseData,
        cookieStatus: {
          hasCookieNow: !!authCookieOnResponse,
          cookieValueLength: authCookieOnResponse?.value?.length || 0,
          allCookies: allCookiesOnResponse.map(c => ({ name: c.name, hasValue: !!c.value, valueLength: c.value?.length || 0 })),
          cookieCount: allCookiesOnResponse.length
        },
        backendMessage: responseMessage,
        action: 'User should log out and log back in'
      });
      return {
        Status: 401,
        Message: authErrorMessage,
        data: responseData
      };
    }
    
    // Handle success (201, 200) and partial success (207 = Multi-Status from batched processing)
    if (responseStatus === 201 || responseStatus === 200 || responseStatus === 207) {
      return { 
        Status: responseStatus === 207 ? 207 : 201, // Preserve 207 for partial success
        Message: responseMessage,
        data: responseData
      }
    } else {
      // Even if status is not success, return the response so the caller can see the error details
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
      // Re-check cookie status when 401 occurs
      const cookieStoreOnError = await cookies();
      const authCookieOnError = cookieStoreOnError.get('xyzCompAuthorize');
      const allCookiesOnError = cookieStoreOnError.getAll();
      
      errorMessage = 'Authentication failed. Your session may have expired. Please log out and log back in, then try again.';
      console.error('❌ GenerateBookings: 401 Unauthorized - Authentication failed:', {
        status: 401,
        responseData: err.response?.data,
        responseStatusText: err.response?.statusText,
        cookieStatus: {
          hasCookieNow: !!authCookieOnError,
          cookieValueLength: authCookieOnError?.value?.length || 0,
          allCookies: allCookiesOnError.map(c => ({ name: c.name, hasValue: !!c.value, valueLength: c.value?.length || 0 })),
          cookieCount: allCookiesOnError.length
        },
        requestDetails: {
          url: err.config?.url,
          baseURL: err.config?.baseURL,
          fullUrl: err.config ? `${err.config.baseURL}${err.config.url}` : 'unknown',
          method: err.config?.method,
          headers: err.config?.headers ? Object.keys(err.config.headers) : [],
          cookieHeader: err.config?.headers?.Cookie ? 'present' : 'missing'
        },
        possibleCauses: [
          'Session expired - user needs to log in again',
          'Cookie not being sent correctly to backend',
          'Cookie invalid or corrupted',
          'Backend authentication service unavailable',
          'Cookie expired between check and request',
          'Backend rejecting cookie format'
        ],
        action: 'User should log out and log back in, then try again'
      });
    } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      // Check if this is a timeout with a single credit ID - indicates backend performance issue
      const isSingleCreditTimeout = creditIds.length === 1;
      
      if (isSingleCreditTimeout) {
        errorMessage = `Backend timeout: Processing 1 credit ID (${creditIds[0]}) took longer than 2 minutes. This indicates a backend performance issue. Please check backend logs at ${baseURL} for the GenerateBookings endpoint. The backend may be stuck or processing very slowly.`;
        console.error('🚨 CRITICAL: Backend timeout with single credit ID:', {
          creditId: creditIds[0],
          timeout: '120 seconds',
          issue: 'Backend is taking too long to process a single credit ID',
          possibleCauses: [
            'Backend endpoint is stuck in an infinite loop',
            'Database query is hanging or very slow',
            'External API call is timing out',
            'Backend is waiting for a resource that never becomes available',
            'Backend server is overloaded or unresponsive'
          ],
          action: 'Check backend logs and server status',
          backendUrl: baseURL,
          endpoint: '/ApprovedUserCredits/GenerateBookings'
        });
      } else {
        errorMessage = `Request timed out after 2 minutes while processing ${creditIds.length} credit IDs. The server may still be processing your request. Please check backend logs or try again with fewer credit IDs.`;
      }
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