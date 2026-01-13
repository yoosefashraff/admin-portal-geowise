"use server";

import axios, { AxiosInstance } from "axios";
import { cookies } from "next/headers";
import serverAPI from "@/lib/api/axios-server";
import { fetchBookings } from "./calendar.actions";
import type { FetchBookingsParams } from "@/lib/types/calendar";

/**
 * Get API URL for service requests
 * Uses NEXT_PUBLIC_SERVICE_REQUESTS_API_URL if set (for dev testing),
 * otherwise falls back to NEXT_PUBLIC_API_URL (production)
 */
function getServiceRequestsApiUrl(): string {
  const devUrl = process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL;
  const prodUrl = process.env.NEXT_PUBLIC_API_URL;
  
  const apiUrl = devUrl || prodUrl || 'https://gw5cn.geowise.ai';
  
  // Remove trailing slash
  const baseUrl = apiUrl.replace(/\/+$/, '');
  
  // Log which environment is being used
  if (typeof window === 'undefined') {
    console.warn('🔧 Service Requests API URL:', {
      usingDev: !!devUrl,
      devUrl: devUrl || 'not set',
      prodUrl: prodUrl || 'not set',
      resolvedUrl: baseUrl
    });
  }
  
  return baseUrl;
}

/**
 * Create a custom axios instance for service requests
 * Uses dev environment if NEXT_PUBLIC_SERVICE_REQUESTS_API_URL is set
 * Exported for use in other actions (e.g., auto-dispatch)
 */
export async function createServiceRequestsAxios(): Promise<AxiosInstance> {
  const baseURL = getServiceRequestsApiUrl();
  const cookieStore = await cookies();
  const token = cookieStore.get('xyzCompAuthorize')?.value;
  
  const instance = axios.create({
    baseURL,
    timeout: 60000, // 60 seconds for file uploads
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  // Add request interceptor for authentication and FormData handling
  instance.interceptors.request.use(
    (config) => {
      if (token && config.headers) {
        config.headers.Cookie = `xyzCompAuthorize=${token}`;
      }
      
      // Remove Content-Type for FormData - axios will set it automatically with boundary
      if (config.data instanceof FormData && config.headers) {
        delete config.headers['Content-Type'];
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // Add response interceptor to return data directly
  instance.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error)
  );
  
  return instance;
}

/**
 * Fetch service requests for the current date range
 * Defaults to today's date range
 */
export async function fetchServiceRequests(
  startDate?: string,
  endDate?: string,
  onlyConfirmed?: boolean,
  companyAdminId?: number
): Promise<any> {
  const today = new Date()
  const defaultStartDate = startDate || today.toISOString().split('T')[0]
  const defaultEndDate = endDate || today.toISOString().split('T')[0]

  const params: FetchBookingsParams = {
    StartDate: `${defaultStartDate}T00:00:00Z`,
    EndDate: `${defaultEndDate}T23:59:59Z`,
    IsOnlyConfirmed: onlyConfirmed ?? false,
    CompanyAdminId: companyAdminId || 0,
  }

  return fetchBookings(params)
}

/**
 * Fetch imported service requests (before they're converted to bookings)
 * These are the records imported via the /import endpoint
 * GET /ServiceRequests/List or similar endpoint
 */
export async function fetchImportedServiceRequests(): Promise<{ Status: number; Message?: string; data?: any[] }> {
  // Use custom axios instance for service requests (may point to dev environment)
  const serviceRequestsAPI = await createServiceRequestsAxios();
  
  // Try different possible endpoints for listing imported service requests
  const possibleEndpoints = [
    '/ApprovedUserCredits/Imported',  // Most likely - same controller as import
    '/ApprovedUserCredits/ListImported',
    '/ServiceRequests/Imported',
    '/ServiceRequests/ListImported',
    '/ServiceRequest/Imported',
    '/ServiceRequest/ListImported',
    '/ServiceRequests/List',
    '/ServiceRequest/List',
    '/ServiceRequests',
    '/ServiceRequest',
  ];
  
  // Try each endpoint until one works
  for (const endpoint of possibleEndpoints) {
    try {
      const fullUrl = `${getServiceRequestsApiUrl()}${endpoint}`;
      console.warn(`🔍 Trying to fetch imported service requests from: ${endpoint}`);
      console.warn(`   Full URL: ${fullUrl}`);
      const response: any = await serviceRequestsAPI.get(endpoint);
      
      console.warn(`📥 Response from ${endpoint}:`, {
        Status: response.Status,
        isArray: Array.isArray(response),
        hasData: !!response.data,
        hasObject: !!response.Object,
        dataLength: Array.isArray(response) ? response.length : (response.data?.length || response.Object?.length || 0),
        responseType: typeof response,
        responseKeys: typeof response === 'object' ? Object.keys(response) : []
      });
      
      if (response.Status === 201 || Array.isArray(response)) {
        const data = Array.isArray(response) ? response : (response.Object || response.data || []);
        if (Array.isArray(data) && data.length > 0) {
          console.warn(`✅ Successfully fetched ${data.length} imported service requests from ${endpoint}`);
          return {
            Status: 201,
            data
          };
        } else {
          console.warn(`⚠️ Endpoint ${endpoint} returned empty array`);
        }
      } else {
        console.warn(`⚠️ Endpoint ${endpoint} returned Status: ${response.Status}`);
      }
    } catch (err: any) {
      // Continue to next endpoint if this one fails
      console.warn(`❌ Endpoint ${endpoint} failed:`, {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        responseData: err.response?.data
      });
      continue;
    }
  }
  
  // If all endpoints failed, return empty array
  console.warn('⚠️ Could not fetch imported service requests from any endpoint. They may not be available via API yet.');
  console.warn('💡 IMPORTANT: Imported records may have been converted to bookings and will appear in the regular service requests list.');
  console.warn('   Check the regular service requests table - they should appear there as bookings/callouts.');
  return { Status: 200, data: [] };
}

/**
 * Fetch dispatch logs (historical bookings/dispatches)
 * Fetches bookings from a past date range to show dispatch history
 */
export async function fetchDispatchLogs(
  daysBack: number = 30,
  onlyConfirmed?: boolean,
  companyAdminId?: number
): Promise<any> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysBack)

  const startDateStr = startDate.toISOString().split('T')[0]
  const endDateStr = endDate.toISOString().split('T')[0]

  const params: FetchBookingsParams = {
    StartDate: `${startDateStr}T00:00:00Z`,
    EndDate: `${endDateStr}T23:59:59Z`,
    IsOnlyConfirmed: onlyConfirmed ?? false,
    CompanyAdminId: companyAdminId || 0,
  }

  return fetchBookings(params)
}

/**
 * Import Service Requests from a file (bulk import)
 * POST /ServiceRequests/import
 * Content-Type: multipart/form-data
 * Form-data key: file
 * 
 * @param formData - FormData object containing the file with key 'file'
 *                   Client should create: formData.append('file', file)
 */
export async function importServiceRequests(
  formData: FormData
): Promise<{ Status: number; Message?: string; data?: { success: number; errors?: string[] } }> {
  try {
    // Use custom axios instance for service requests (may point to dev environment)
    const serviceRequestsAPI = await createServiceRequestsAxios();
    const baseURL = getServiceRequestsApiUrl();
    
    // Try different possible endpoint paths (backend might use different naming)
    // Based on pattern: GenerateBookings is under /ApprovedUserCredits, so import might be too
    // Priority: 1) ApprovedUserCredits/import, 2) ServiceRequests/import, 3) ServiceRequest/import
    const possibleEndpoints = [
      '/ApprovedUserCredits/import',  // Most likely - same controller as GenerateBookings
      '/ServiceRequests/import',
      '/ServiceRequest/import',  // Singular
      '/import',  // Root level
    ];
    
    const endpoint = possibleEndpoints[0]; // Start with the most likely one
    const isUsingDev = !!process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL;
    const fullUrl = `${baseURL}${endpoint}`;
    
    console.warn('📤 ServiceRequests Import API Request:', {
      endpoint,
      baseURL,
      fullUrl,
      tryingEndpoints: possibleEndpoints,
      usingDevEnvironment: isUsingDev,
      protocol: baseURL.startsWith('https') ? 'HTTPS' : 'HTTP',
    });
    
    // CRITICAL: Log where data will be stored
    // Note: Dev environment is for testing, but data should be treated as REAL (realistic locations, real data structure)
    console.warn('⚠️ IMPORT DATA STORAGE LOCATION:', {
      environment: isUsingDev ? 'DEV (Testing Environment)' : 'PRODUCTION',
      apiUrl: baseURL,
      message: isUsingDev 
        ? '✅ Data will be stored on DEV environment (testing database, but data is REAL and realistic)'
        : '⚠️ Data will be stored on PRODUCTION environment (use with caution!)',
      devUrl: process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL || 'not set',
      prodUrl: process.env.NEXT_PUBLIC_API_URL || 'not set',
      note: 'Dev environment uses separate database for testing, but data structure and locations are realistic'
    });
    
    console.warn('⏳ Starting import request to:', fullUrl);
    const requestStartTime = Date.now();
    
    // Add parameter to prevent auto-conversion to bookings
    // Backend should keep imported records as pending service requests until explicitly dispatched
    // Try adding as query parameter or form field
    const preventAutoConvert = true; // We want to prevent auto-conversion
    
    // Add as query parameter (if backend supports it)
    const endpointWithParams = preventAutoConvert 
      ? `${endpoint}?autoConvert=false&createBookings=false`
      : endpoint;
    
    // Also try adding as form field (some backends prefer this for multipart/form-data)
    if (preventAutoConvert) {
      formData.append('autoConvert', 'false');
      formData.append('createBookings', 'false');
      formData.append('keepAsPending', 'true');
    }
    
    console.warn('📤 Import request parameters:', {
      endpoint: endpointWithParams,
      preventAutoConvert,
      formDataKeys: Array.from(formData.keys()),
      note: 'Backend should keep imported records as pending service requests, not convert to bookings immediately'
    });
    
    // For FormData, axios will automatically set Content-Type with boundary
    // Don't set it manually as it will break the upload
    let response: any;
    try {
      response = await serviceRequestsAPI.post(
        endpointWithParams,
        formData
      );
      const requestDuration = Date.now() - requestStartTime;
      console.warn('✅ Import request completed in', requestDuration, 'ms');
    } catch (requestError: any) {
      const requestDuration = Date.now() - requestStartTime;
      console.error('❌ Import request failed after', requestDuration, 'ms:', {
        message: requestError.message,
        code: requestError.code,
        status: requestError.response?.status,
        statusText: requestError.response?.statusText,
        responseData: requestError.response?.data,
        isTimeout: requestError.code === 'ECONNABORTED' || requestError.message?.includes('timeout'),
        isNetworkError: requestError.code === 'ERR_NETWORK' || requestError.message === 'Network Error',
        isRedirect: requestError.response?.status === 301 || requestError.response?.status === 302 || requestError.response?.status === 307 || requestError.response?.status === 308,
      });
      throw requestError; // Re-throw to be caught by outer catch block
    }
    
    // Log the full import response to see what it contains
    console.log('📥 Import API Response (full):', JSON.stringify(response, null, 2))
    console.log('Import API Response (summary):', {
      Status: response.Status,
      Message: response.Message,
      hasData: !!response.data,
      hasObject: !!response.Object,
      dataKeys: response.data ? Object.keys(response.data) : [],
      objectKeys: response.Object ? Object.keys(response.Object) : [],
      dataType: typeof response.data,
      objectType: typeof response.Object
    })
    
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
    // Enhanced error logging
    console.error('❌ ServiceRequests Import Error:', {
      message: err.message,
      code: err.code,
      name: err.name,
      status: err.response?.status,
      statusText: err.response?.statusText,
      responseData: err.response?.data,
      requestUrl: err.config?.url,
      requestBaseURL: err.config?.baseURL,
      fullUrl: err.config ? `${err.config.baseURL}${err.config.url}` : 'unknown',
      isTimeout: err.code === 'ECONNABORTED' || err.message?.includes('timeout'),
      isNetworkError: err.code === 'ERR_NETWORK' || err.message === 'Network Error',
      isRedirect: err.response?.status === 301 || err.response?.status === 302 || err.response?.status === 307 || err.response?.status === 308,
      redirectLocation: err.response?.headers?.location,
    })
    
    // Handle redirects (HTTP to HTTPS, etc.)
    if (err.response?.status === 301 || err.response?.status === 302 || err.response?.status === 307 || err.response?.status === 308) {
      const redirectLocation = err.response?.headers?.location;
      const attemptedUrl = err.config ? `${err.config.baseURL}${err.config.url}` : 'unknown';
      console.error('🔄 Redirect detected:', {
        from: attemptedUrl,
        to: redirectLocation,
        status: err.response?.status
      });
      return { 
        Status: err.response?.status, 
        Message: `Backend redirected request from ${attemptedUrl} to ${redirectLocation || 'unknown location'}. This may indicate the dev backend requires HTTPS or a different URL.` 
      }
    }
    
    // Handle 404 specifically
    if (err.response?.status === 404) {
      const attemptedUrl = err.config ? `${err.config.baseURL}${err.config.url}` : '/ServiceRequests/import';
      return { 
        Status: 404, 
        Message: `Import endpoint not found at ${attemptedUrl}. Please verify with the backend developer the exact endpoint path. Common paths: /ServiceRequests/import, /ServiceRequest/import, or /import` 
      }
    }
    
    // Handle timeout
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return { 
        Status: 408, 
        Message: `Import request timed out. The dev backend (${err.config?.baseURL || 'unknown'}) may be slow or unresponsive. Please try again or contact the backend developer.` 
      }
    }
    
    // Handle network errors
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { 
        Status: 503, 
        Message: `Cannot connect to dev backend (${err.config?.baseURL || 'unknown'}). Please verify the backend is running and accessible.` 
      }
    }
    
    // Handle other HTTP errors
    if (err.response) {
      const status = err.response.status || 500
      const responseData = err.response.data
      
      // Try to extract message from response
      let errorMessage = 'Failed to import service requests'
      if (typeof responseData === 'string') {
        errorMessage = responseData
      } else if (responseData?.Message) {
        errorMessage = responseData.Message
      } else if (responseData?.message) {
        errorMessage = responseData.message
      } else if (err.response.statusText) {
        errorMessage = err.response.statusText
      }
      
      return { Status: status, Message: errorMessage }
    }
    
    // Network or other errors
    const errorMessage = err.message || 'Failed to import service requests'
    return { Status: 500, Message: errorMessage }
  }
}