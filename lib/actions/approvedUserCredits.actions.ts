"use server";

import { cookies } from "next/headers";
import serverAPI from "@/lib/api/axios-server";

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
 */
export async function listApprovedUserCredits(
  params: ListCreditsParams
): Promise<{ Status: number; Message?: string; data?: ApprovedUserCredit[] }> {
  try {
    // Let axios-server handle cookie authentication (same as getCurrentUserAction)
    const queryParams = new URLSearchParams()
    
    if (params.PageNumber) queryParams.append('PageNumber', params.PageNumber.toString())
    if (params.PageSize) queryParams.append('PageSize', params.PageSize.toString())
    if (params.UserId) queryParams.append('UserId', params.UserId.toString())
    if (params.ServiceId) queryParams.append('ServiceId', params.ServiceId.toString())
    if (params.IsActive !== undefined) queryParams.append('IsActive', params.IsActive.toString())
    if (params.SearchTerm) queryParams.append('SearchTerm', params.SearchTerm)

    const url = `/ApprovedUserCredits/List${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    
    // Log the request for debugging
    const baseURL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
    console.log('ApprovedUserCredits API Request:', {
      url,
      baseURL,
      fullUrl: `${baseURL}${url}`,
      envVar: process.env.NEXT_PUBLIC_API_URL
    })
    
    const response: any = await serverAPI.get(url)
    
    // Log the response type and first 500 chars for debugging
    console.log('ApprovedUserCredits API Response:', {
      type: typeof response,
      isArray: Array.isArray(response),
      hasStatus: response?.Status !== undefined,
      hasData: response?.data !== undefined,
      hasObject: response?.Object !== undefined,
      preview: typeof response === 'string' ? response.substring(0, 500) : JSON.stringify(response).substring(0, 500)
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
      console.warn('Unexpected response format from ApprovedUserCredits API:', typeof response === 'string' ? response.substring(0, 200) : JSON.stringify(response, null, 2))
      return { Status: response.Status || 500, Message: response.Message || `Unexpected response format. Response type: ${typeof response}`, data: [] }
    }
  } catch (err: any) {
    // Enhanced error logging for debugging
    console.error('ApprovedUserCredits API Error:', {
      message: err.message,
      code: err.code,
      responseStatus: err.response?.status,
      responseStatusText: err.response?.statusText,
      responseData: typeof err.response?.data === 'string' 
        ? err.response.data.substring(0, 500) 
        : JSON.stringify(err.response?.data).substring(0, 500),
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
          actualBaseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
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
    // Handle axios errors without response (network errors, etc.)
    if (err.request) {
      console.error('Network error - no response received:', {
        message: err.message,
        code: err.code
      })
      return { Status: 500, Message: 'Network error. Please check your connection.', data: [] }
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
    const response: any = await serverAPI.get('/ApprovedUserCredits/GetByUserId')
    
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
 */
export async function createApprovedUserCredit(
  data: Omit<ApprovedUserCredit, 'Id'>
): Promise<{ Status: number; Message?: string; data?: ApprovedUserCredit }> {
  try {
    const response: any = await serverAPI.post('/ApprovedUserCredits/add', data)
    
    if (response.Status === 201) {
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
    const errorMessage = err.response?.statusText || err.message || 'Failed to create ApprovedUserCredit'
    return { Status: 500, Message: errorMessage }
  }
}

/**
 * Update an existing ApprovedUserCredit record
 * POST /ApprovedUserCredits/Update
 */
export async function updateApprovedUserCredit(
  data: ApprovedUserCredit
): Promise<{ Status: number; Message?: string; data?: ApprovedUserCredit }> {
  try {
    const response: any = await serverAPI.post('/ApprovedUserCredits/Update', data)
    
    if (response.Status === 201) {
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
    const errorMessage = err.response?.statusText || err.message || 'Failed to update ApprovedUserCredit'
    return { Status: 500, Message: errorMessage }
  }
}

/**
 * Delete ApprovedUserCredit (soft delete by setting IsActive to false)
 * POST /ApprovedUserCredits/Delete?id={id}
 */
export async function deleteApprovedUserCredit(
  id: number
): Promise<{ Status: number; Message?: string }> {
  try {
    const response: any = await serverAPI.post(`/ApprovedUserCredits/Delete?id=${id}`)
    
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
 */
export async function getApprovedUserCreditById(
  id: number
): Promise<{ Status: number; Message?: string; data?: ApprovedUserCredit & { UserName?: string; UserEmail?: string; ServiceName?: string } }> {
  try {
    const response: any = await serverAPI.get(`/ApprovedUserCredits/GetById?id=${id}`)
    
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
    const response: any = await serverAPI.post(
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
    const response: any = await serverAPI.post(
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