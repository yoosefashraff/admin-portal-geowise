"use server";

import axios, { AxiosInstance } from "axios";
import { cookies } from "next/headers";
import serverAPI from "@/lib/api/axios-server";
import { fetchBookings } from "./calendar.actions";
import type { FetchBookingsParams } from "@/lib/types/calendar";

/**
 * Get API URL for service requests
 * Uses NEXT_PUBLIC_DEV_API_URL if set (for dev testing - applies to whole app),
 * falls back to NEXT_PUBLIC_SERVICE_REQUESTS_API_URL (legacy),
 * otherwise uses NEXT_PUBLIC_API_URL (production)
 */
function getServiceRequestsApiUrl(): string {
  // New dev environment variable (applies to whole app)
  const devUrl = process.env.NEXT_PUBLIC_DEV_API_URL;
  // Legacy variable (backward compatibility)
  const legacyDevUrl = process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL;
  const prodUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // Remove quotes if present (common mistake in .env files)
  const cleanDevUrl = devUrl ? devUrl.replace(/^["']|["']$/g, '').trim() : undefined;
  const cleanLegacyDevUrl = legacyDevUrl ? legacyDevUrl.replace(/^["']|["']$/g, '').trim() : undefined;
  const cleanProdUrl = prodUrl ? prodUrl.replace(/^["']|["']$/g, '').trim() : undefined;
  
  // Use new dev variable first, then legacy
  const finalDevUrl = cleanDevUrl || cleanLegacyDevUrl;
  
  // CRITICAL: Require dev environment - do NOT fall back to production
  if (!finalDevUrl) {
    const errorMsg = 'Dev environment not configured. Please set NEXT_PUBLIC_DEV_API_URL to use dev backend.';
    console.error('❌ Production API disabled:', {
      reason: 'Production API usage is disabled for testing',
      requiredEnvVar: 'NEXT_PUBLIC_DEV_API_URL',
      action: 'Set NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai',
      note: 'Legacy NEXT_PUBLIC_SERVICE_REQUESTS_API_URL also supported for backward compatibility',
      devUrl: cleanDevUrl || 'not set',
      legacyDevUrl: cleanLegacyDevUrl || 'not set',
      prodUrl: cleanProdUrl || 'not set'
    });
    throw new Error(errorMsg);
  }
  
  // Normalize URL - remove trailing slash (axios will add it when needed)
  // Paths in axios calls start with /, so baseURL should not have trailing slash
  const baseUrl = finalDevUrl.replace(/\/+$/, '');
  
  // Warn if dev environment uses HTTP (should use HTTPS)
  if (typeof window === 'undefined' && finalDevUrl.startsWith('http://')) {
    console.warn('⚠️ WARNING: Dev environment URL uses HTTP instead of HTTPS:', {
      currentUrl: finalDevUrl,
      recommended: finalDevUrl.replace('http://', 'https://'),
      reason: 'HTTPS is required to avoid mixed content security issues when frontend is served over HTTPS'
    });
  }
  
  // Log which environment is being used
  if (typeof window === 'undefined') {
    console.warn('🔧 Service Requests API URL:', {
      usingDev: true,
      devUrl: finalDevUrl,
      resolvedUrl: baseUrl,
      protocol: baseUrl.startsWith('https') ? 'HTTPS ✅' : 'HTTP ⚠️',
      note: cleanLegacyDevUrl ? 'Using legacy NEXT_PUBLIC_SERVICE_REQUESTS_API_URL' : 'Using NEXT_PUBLIC_DEV_API_URL'
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
  
  // Log the baseURL being used (this will show in SERVER terminal, not browser)
  console.warn('🔧 [createServiceRequestsAxios] Creating axios instance:', {
    baseURL,
    isDev: baseURL.includes('gw5cndev') || baseURL.includes('localhost'),
    envVar: process.env.NEXT_PUBLIC_DEV_API_URL || process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL || 'not set',
    note: 'Check SERVER terminal (not browser console) for this log'
  });
  
  // Also log to stderr so it's more visible
  if (typeof window === 'undefined') {
    console.error('🔍 [DIAGNOSTIC] ServiceRequestsAxios baseURL:', baseURL);
  }
  
  // For dev environment, handle SSL certificate verification issues
  // The dev backend may use a self-signed certificate or certificate not in Node.js CA store
  const isDevEnvironment = baseURL.includes('gw5cndev') || baseURL.includes('localhost');
  const httpsAgent = isDevEnvironment 
    ? new (require('https').Agent)({
        rejectUnauthorized: false // Only for dev - allows self-signed certs
      })
    : undefined;
  
  const instance = axios.create({
    baseURL,
    timeout: 60000, // 60 seconds for file uploads
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json", // Explicitly request JSON responses
      "X-Requested-With": "XMLHttpRequest", // Tell backend this is an AJAX request (prevents HTML redirects)
    },
    ...(httpsAgent && { httpsAgent })
  });
  
  // Add interceptor to log actual request URLs
  instance.interceptors.request.use((config) => {
    const fullUrl = `${config.baseURL}${config.url}`;
    console.warn('🌐 [createServiceRequestsAxios] Request interceptor:', {
      method: config.method?.toUpperCase(),
      baseURL: config.baseURL,
      url: config.url,
      fullUrl,
      hasHttpsAgent: !!config.httpsAgent
    });
    return config;
  });
  
  // Add request interceptor for authentication and FormData handling
  // IMPORTANT: Read cookie fresh on each request to ensure we have the latest value
  instance.interceptors.request.use(
    async (config) => {
      // Read cookie fresh on each request (cookies can change between requests)
      const cookieStore = await cookies();
      const cookie = cookieStore.get('xyzCompAuthorize');
      const token = cookie?.value;
      
      // Log all available cookies for debugging
      const allCookies = cookieStore.getAll();
      const cookieNames = allCookies.map(c => c.name);
      
      if (token && config.headers) {
        // Set Cookie header in the format: Cookie: xyzCompAuthorize=<token>
        config.headers.Cookie = `xyzCompAuthorize=${token}`;
        console.error('🔐 ===== ADDING AUTHENTICATION COOKIE TO REQUEST =====');
        console.error('🔐 Adding authentication cookie to request:', {
          url: config.url,
          baseURL: config.baseURL,
          fullUrl: `${config.baseURL}${config.url}`,
          hasToken: !!token,
          tokenLength: token?.length || 0,
          tokenPreview: token ? `${token.substring(0, 30)}...` : 'none',
          method: config.method?.toUpperCase(),
          cookieHeader: config.headers.Cookie ? `${config.headers.Cookie.substring(0, 50)}...` : 'not set',
          allAvailableCookies: cookieNames,
          cookieHeaderFull: config.headers.Cookie // Show full header for debugging
        });
        console.error('🔐 ====================================================');
      } else {
        console.error('⚠️ ===== NO AUTHENTICATION TOKEN AVAILABLE =====');
        console.error('⚠️ No authentication token available for request:', {
          url: config.url,
          baseURL: config.baseURL,
          fullUrl: `${config.baseURL}${config.url}`,
          cookieFound: !!cookie,
          cookieHasValue: !!cookie?.value,
          availableCookies: cookieNames,
          cookieCount: allCookies.length,
          action: 'Please ensure you are logged in. Cookie xyzCompAuthorize is required.'
        });
        console.error('⚠️ ================================================');
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
    (response) => {
      // Check Content-Type header first
      const contentType = response.headers['content-type'] || response.headers['Content-Type'] || '';
      const isJson = contentType.includes('application/json');
      const isHtml = contentType.includes('text/html') || contentType.includes('text/plain');
      
      // Check if response is HTML (error page) instead of JSON
      const data = response.data;
      const isHtmlContent = typeof data === 'string' && (data.includes('<html') || data.includes('<!DOCTYPE') || data.trim().startsWith('<'));
      
      if (isHtml || isHtmlContent) {
        // Extract title or key text from HTML for better error messages
        let htmlPreview = typeof data === 'string' ? data.substring(0, 1000) : 'not a string';
        let errorHint = 'Unknown error';
        if (typeof data === 'string') {
          // Try to extract title or error message from HTML
          const titleMatch = data.match(/<title[^>]*>([^<]+)<\/title>/i);
          const h1Match = data.match(/<h1[^>]*>([^<]+)<\/h1>/i);
          const errorMatch = data.match(/error[^>]*>([^<]+)/i);
          if (titleMatch) errorHint = `Page title: ${titleMatch[1]}`;
          else if (h1Match) errorHint = `Heading: ${h1Match[1]}`;
          else if (errorMatch) errorHint = `Error text: ${errorMatch[1]}`;
          else if (data.includes('login') || data.includes('Login')) errorHint = 'Login page (authentication required)';
          else if (data.includes('404') || data.includes('Not Found')) errorHint = '404 Not Found (endpoint may not exist)';
          else if (data.includes('401') || data.includes('Unauthorized')) errorHint = '401 Unauthorized (authentication failed)';
        }
        
        console.error('❌ Backend returned HTML instead of JSON:', {
          url: response.config?.url,
          baseURL: response.config?.baseURL,
          fullUrl: `${response.config?.baseURL}${response.config?.url}`,
          status: response.status,
          statusText: response.statusText,
          contentType: contentType || 'not set',
          errorHint,
          preview: htmlPreview,
          requestHeaders: response.config?.headers,
          responseHeaders: response.headers
        });
        // Reject as error so it goes to error handler
        const error: any = new Error(`Backend returned HTML instead of JSON (status ${response.status}): ${errorHint}`);
        error.response = {
          status: response.status,
          statusText: response.statusText,
          data: data,
          headers: response.headers
        };
        error.config = response.config;
        return Promise.reject(error);
      }
      
      // Validate JSON response
      if (!isJson && typeof data !== 'object' && typeof data !== 'string') {
        console.warn('⚠️ Unexpected response format:', {
          contentType,
          dataType: typeof data,
          preview: typeof data === 'string' ? data.substring(0, 200) : String(data).substring(0, 200)
        });
      }
      
      return data;
    },
    (error) => {
      // Enhanced error logging
      console.error('❌ ServiceRequestsAxios request failed:', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullUrl: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        errorCode: error.code,
        errorMessage: error.message,
        hasResponse: !!error.response,
        hasRequest: !!error.request,
        responseData: error.response?.data ? (typeof error.response.data === 'string' ? error.response.data.substring(0, 200) : JSON.stringify(error.response.data).substring(0, 200)) : 'none'
      });
      return Promise.reject(error);
    }
  );
  
  return instance;
}

/**
 * Fetch service requests for the current date range
 * Uses DEV environment if NEXT_PUBLIC_SERVICE_REQUESTS_API_URL is set
 * This ensures we fetch from the same environment where we import data
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

  // CRITICAL: Use dev environment for fetching if configured
  // This ensures we fetch from the same environment where we import data
  const baseURL = getServiceRequestsApiUrl(); // This throws if dev not configured
  
  console.warn('🔍 Fetching service requests:', {
    environment: 'DEV',
    apiUrl: baseURL,
    dateRange: `${defaultStartDate} to ${defaultEndDate}`,
    reason: 'Using same environment as imports to ensure data consistency'
  });

  // Use dev environment axios instance (60s timeout)
  const serviceRequestsAPI = await createServiceRequestsAxios();
  
  // Log the actual URL that will be called
  const fullUrl = `${baseURL}/api/barber/FetchBookings`;
  console.warn('🔍 [fetchServiceRequests] Making API call:', {
    baseURL,
    endpoint: '/api/barber/FetchBookings',
    fullUrl,
    params
  });
  
  try {
    // Use /api/barber/FetchBookings - this matches the calendar actions endpoint
    // The axios instance baseURL already includes the full domain, so this will be:
    // https://gw5cndev.geowise.ai/api/barber/FetchBookings
    const response: any = await serviceRequestsAPI.post('/api/barber/FetchBookings', params, {
      headers: {
        TimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        DeviceToken: 'test12345',
        IsTest: 'true'
      }
    });
    
    console.warn('✅ Fetched service requests from DEV environment:', {
      status: response.Status,
      hasObject: !!response.Object,
      objectType: Array.isArray(response.Object) ? 'array' : typeof response.Object
    });
    
    return response;
  } catch (err: any) {
    // Enhanced error logging to diagnose connection issues
    const errorDetails = {
      error: err.message,
      code: err.code,
      status: err.response?.status,
      statusText: err.response?.statusText,
      baseURL: baseURL,
      endpoint: '/api/barber/FetchBookings',
      fullUrl: `${baseURL}/api/barber/FetchBookings`,
      isTimeout: err.code === 'ETIMEDOUT' || err.message?.includes('timeout'),
      isConnectionError: err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT',
      reason: 'Production fallback disabled to ensure dev-only testing',
      action: 'Please ensure dev backend is running and accessible',
      note: 'If IP 8.213.23.175 appears, check if gw5cndev.geowise.ai DNS resolves correctly'
    };
    
    console.error('❌ Failed to fetch from DEV environment - NOT falling back to production:', errorDetails);
    
    // Return a graceful error response instead of throwing
    // This prevents the page from completely breaking
    const errorMessage = err.code === 'ETIMEDOUT' 
      ? `Connection timeout: The dev backend (${baseURL}) is not responding. Please check if the backend is running and accessible.`
      : `Failed to fetch service requests: ${err.message}`;
    
    console.error('❌ Failed to fetch from DEV environment - NOT falling back to production:', {
      error: err.message,
      code: err.code,
      baseURL,
      fullUrl: `${baseURL}/api/barber/FetchBookings`,
      note: 'Returning error response instead of throwing to prevent page crash'
    });
    
    // Return error response instead of throwing to allow UI to handle gracefully
    return {
      Status: 500,
      Message: errorMessage,
      Object: null
    };
  }
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
    const fullUrl = `${baseURL}${endpoint}`;
    
    console.warn('📤 ServiceRequests Import API Request:', {
      endpoint,
      baseURL,
      fullUrl,
      tryingEndpoints: possibleEndpoints,
      usingDevEnvironment: true,
      protocol: baseURL.startsWith('https') ? 'HTTPS' : 'HTTP',
    });
    
    // CRITICAL: Log where data will be stored
    // Note: Dev environment is for testing, but data should be treated as REAL (realistic locations, real data structure)
    console.warn('⚠️ IMPORT DATA STORAGE LOCATION:', {
      environment: 'DEV (Testing Environment)',
      apiUrl: baseURL,
      message: '✅ Data will be stored on DEV environment (testing database, but data is REAL and realistic)',
      devUrl: process.env.NEXT_PUBLIC_DEV_API_URL || process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL || 'not set',
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