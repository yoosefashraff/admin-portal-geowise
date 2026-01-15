"use server";

import axios, { AxiosInstance } from "axios";
import { cookies } from "next/headers";
import serverAPI from "@/lib/api/axios-server";
import { fetchBookings } from "./calendar.actions";
import type { FetchBookingsParams } from "@/lib/types/calendar";
import { getServicesForCompany } from "./service.actions";
import { getCustomerByPhoneAndType, createCustomer } from "./scheduler.actions";
import { getCallingCode } from "@/lib/utils";

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
  let baseUrl = finalDevUrl.replace(/\/+$/, '');

  // CRITICAL: Upgrade to HTTPS for the known dev domain which supports HTTPS.
  // This avoids Mixed Content issues when the client receives these URLs
  if (baseUrl.startsWith('http://gw5cndev.geowise.ai')) {
    baseUrl = baseUrl.replace('http://', 'https://');
  }

  // Warn if dev environment uses HTTP (should use HTTPS)
  if (typeof window === 'undefined' && baseUrl.startsWith('http://')) {
    console.warn('⚠️ WARNING: Dev environment URL uses HTTP instead of HTTPS:', {
      currentUrl: baseUrl,
      recommended: baseUrl.replace('http://', 'https://'),
      reason: 'HTTPS is required to avoid mixed content security issues when frontend is served over HTTPS'
    });
  }

  // Log which environment is being used
  if (typeof window === 'undefined') {
    console.warn('🔧 Service Requests API URL:', {
      usingDev: true,
      requested: finalDevUrl,
      resolved: baseUrl,
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
    timeout: 600000, // 10 minutes for long-running operations like booking generation
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
      hasHttpsAgent: !!config.httpsAgent,
      timeout: config.timeout
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

      if (token && config.headers) {
        // Set Cookie header in the format: Cookie: xyzCompAuthorize=<token>
        config.headers.Cookie = `xyzCompAuthorize=${token}`;
        console.error('🔐 ===== ADDING AUTHENTICATION COOKIE TO REQUEST =====');
        console.error('🔐 Adding authentication cookie to request:', {
          url: config.url,
          fullUrl: `${config.baseURL}${config.url}`,
          hasToken: !!token,
          method: config.method?.toUpperCase(),
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
        responseData: error.response?.data ? (
          typeof error.response.data === 'string'
            ? error.response.data.substring(0, 200)
            : '[Object]' // Avoid stringifying objects in error logs to prevent circular refs/bloat
        ) : 'none'
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
 * Validate imported data before processing
 * 1. Validates that all services exist in the system
 * 2. Checks customer data format
 * 3. Returns validation errors if any
 */
export async function validateImportData(
  parsedData: any[],
  companyAdminId: number
): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
  serviceValidation: { serviceName: string; exists: boolean; serviceId?: number }[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const serviceValidation: { serviceName: string; exists: boolean; serviceId?: number }[] = [];

  try {
    // Step 1: Fetch all available services
    console.log('🔍 [validateImportData] Fetching services for validation...');
    const servicesResponse = await getServicesForCompany({
      CompanyAdminId: companyAdminId,
      PageNo: 1,
      RecordsPerPage: 1000, // Get all services
    });

    if (servicesResponse.Status !== 201 || !servicesResponse.List) {
      errors.push('Failed to fetch services. Please ensure you have access to the services page.');
      return { isValid: false, errors, warnings, serviceValidation };
    }

    const availableServices = servicesResponse.List;
    const serviceNameMap = new Map<string, number>();
    availableServices.forEach((service: any) => {
      const serviceName = (service.ServiceName || '').trim().toLowerCase();
      if (serviceName) {
        serviceNameMap.set(serviceName, service.Id);
      }
    });

    console.log(`✅ [validateImportData] Found ${availableServices.length} available services`);

    // Step 2: Extract unique service names from import data
    const importedServiceNames = new Set<string>();
    parsedData.forEach((row: any) => {
      const serviceName = (
        row.ApprovedService || // Backend expects this field name (without space/underscore)
        row['Approved Service'] ||
        row['Approved_Service'] ||
        row.Service ||
        row.service ||
        row.ServiceName ||
        row.serviceName ||
        ''
      )
        .toString()
        .trim();

      if (serviceName) {
        importedServiceNames.add(serviceName.toLowerCase());
      }
    });

    console.log(`🔍 [validateImportData] Found ${importedServiceNames.size} unique services in import data`);

    // Step 3: Validate each service exists
    importedServiceNames.forEach((serviceNameLower) => {
      const exists = serviceNameMap.has(serviceNameLower);
      const serviceId = serviceNameMap.get(serviceNameLower);

      // Find original case from import data
      const originalServiceName = Array.from(importedServiceNames).find(
        (name) => name.toLowerCase() === serviceNameLower
      ) || serviceNameLower;

      serviceValidation.push({
        serviceName: originalServiceName,
        exists,
        serviceId: serviceId,
      });

      if (!exists) {
        errors.push(
          `Service "${originalServiceName}" does not exist. Please add it to the Services page first.`
        );
      }
    });

    // Step 4: Validate required fields matching new service request form (Step 1)
    parsedData.forEach((row: any, index: number) => {
      const rowNumber = index + 2; // +2 because Excel rows start at 1, and row 1 is header

      // Required fields from Step 1 of new service request form
      const name =
        row.Name ||
        row.name ||
        row.Patient_Name ||
        row.patient_name ||
        row.Customer ||
        row.customer ||
        '';
      const phone =
        row.Phone ||
        row.phone ||
        row.PhoneNumber ||
        row.phoneNumber ||
        row.Mobile_Number ||
        row.mobile_number ||
        '';
      const countryCode =
        row['Country Code'] ||
        row.CountryCode ||
        row.countryCode ||
        row['Country_Code'] ||
        row.country_code ||
        '';
      const location =
        row.Location ||
        row.location ||
        row.Address ||
        row.address ||
        '';
      const service =
        row.ApprovedService || // Backend expects this field name (without space/underscore)
        row['Approved Service'] ||
        row['Approved_Service'] ||
        row.Service ||
        row.service ||
        row.ServiceName ||
        row.serviceName ||
        '';
      const recurringPeriod =
        row['Recurring Period'] ||
        row.RecurringPeriod ||
        row.recurringPeriod ||
        row['Recurring_Period'] ||
        row.recurring_period ||
        '';
      const expiryDate =
        row['Expiry Date'] ||
        row.ExpiryDate ||
        row.expiryDate ||
        row['Expiry_Date'] ||
        row.expiry_date ||
        row.Date ||
        row.date ||
        '';

      // Validate required fields (matching Step1Form schema)
      if (!name || !name.toString().trim()) {
        errors.push(`Row ${rowNumber}: Name is required (Step 1 field)`);
      }
      if (!phone || !phone.toString().trim()) {
        errors.push(`Row ${rowNumber}: Phone number is required (Step 1 field)`);
      }
      if (!countryCode || !countryCode.toString().trim()) {
        errors.push(`Row ${rowNumber}: Country Code is required (Step 1 field). Use format: "US", "SA", "GB", etc.`);
      }
      if (!location || !location.toString().trim()) {
        errors.push(`Row ${rowNumber}: Location/Address is required (Step 1 field)`);
      }
      if (!service || !service.toString().trim()) {
        errors.push(`Row ${rowNumber}: Service is required (Step 1 field)`);
      }
      if (!recurringPeriod || !recurringPeriod.toString().trim()) {
        errors.push(`Row ${rowNumber}: Recurring Period is required (Step 1 field). Format: "30 days", "1 month", "2 weeks"`);
      }
      if (!expiryDate || !expiryDate.toString().trim()) {
        errors.push(`Row ${rowNumber}: Expiry Date is required (Step 1 field). Format: YYYY-MM-DD`);
      }

      // Validate date format
      if (expiryDate && expiryDate.toString().trim()) {
        const dateStr = expiryDate.toString().trim();
        // Check if it's a valid date format (YYYY-MM-DD or similar)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateStr)) {
          warnings.push(`Row ${rowNumber}: Expiry Date format may be incorrect. Expected: YYYY-MM-DD, got: ${dateStr}`);
        }
      }

      // Validate recurring period format
      if (recurringPeriod && recurringPeriod.toString().trim()) {
        const periodStr = recurringPeriod.toString().trim();
        // Check if it matches format like "30 days", "1 month", "2 weeks"
        const periodRegex = /^\d+\s+(day|days|week|weeks|month|months)$/i;
        if (!periodRegex.test(periodStr)) {
          warnings.push(`Row ${rowNumber}: Recurring Period format may be incorrect. Expected: "30 days" or "1 month", got: ${periodStr}`);
        }
      }
    });

    const isValid = errors.length === 0;

    console.log(`✅ [validateImportData] Validation complete:`, {
      isValid,
      errorsCount: errors.length,
      warningsCount: warnings.length,
      servicesValidated: serviceValidation.length,
      servicesExist: serviceValidation.filter((s) => s.exists).length,
      servicesMissing: serviceValidation.filter((s) => !s.exists).length,
    });

    return { isValid, errors, warnings, serviceValidation };
  } catch (error: any) {
    console.error('❌ [validateImportData] Error during validation:', error);
    errors.push(`Validation error: ${error.message || 'Unknown error'}`);
    return { isValid: false, errors, warnings, serviceValidation };
  }
}

/**
 * Process customers from import data
 * For each unique customer (by phone), check if they exist, create if not
 * Returns a map of phone -> customerId
 * 
 * @param forceCreateNew - If true, always create new customers even if they exist (bypasses phone matching)
 */
export async function processCustomers(
  parsedData: any[],
  companyAdminId: number,
  forceCreateNew: boolean = false
): Promise<{
  success: boolean;
  customerMap: Map<string, number>; // phone -> customerId
  errors: string[];
  created: number;
  existing: number;
}> {
  const customerMap = new Map<string, number>();
  const errors: string[] = [];
  let created = 0;
  let existing = 0;

  try {
    // Extract unique customers by phone number
    const uniqueCustomers = new Map<
      string,
      {
        name: string;
        phone: string;
        countryCode: string;
        address: string;
        lat?: number;
        lng?: number;
      }
    >();

    parsedData.forEach((row: any) => {
      const phone =
        (row.Phone ||
          row.phone ||
          row.Mobile_Number ||
          row.mobile_number ||
          row.PhoneNumber ||
          row.phoneNumber ||
          '')
          .toString()
          .trim();

      if (!phone) return; // Skip rows without phone

      const name =
        (row.Name ||
          row.name ||
          row.Patient_Name ||
          row.patient_name ||
          row.Customer ||
          row.customer ||
          '')
          .toString()
          .trim();

      const address =
        (row.Address ||
          row.address ||
          row.Location ||
          row.location ||
          '')
          .toString()
          .trim();

      // Extract country code (required) - convert to calling code format
      // Import may have country code as "US", "SA", etc. - need to convert to calling code like "+1", "+966"
      let countryCodeStr =
        (row['Country Code'] ||
          row.CountryCode ||
          row.countryCode ||
          row['Country_Code'] ||
          row.country_code ||
          'US') // Default to US if not provided
          .toString()
          .trim();

      // Convert country code to calling code format
      // If it's already a calling code (starts with +), use it
      // Otherwise, convert country code (e.g., "US", "SA") to calling code using utility function
      let countryCode: string;
      if (countryCodeStr.startsWith('+')) {
        // Already a calling code
        countryCode = countryCodeStr;
      } else {
        // Convert country code to calling code using utility
        countryCode = getCallingCode(countryCodeStr.toUpperCase());
      }

      // Parse coordinates if available
      let lat: number | undefined;
      let lng: number | undefined;
      if (row.Lat || row.lat || row.Latitude || row.latitude) {
        lat = parseFloat((row.Lat || row.lat || row.Latitude || row.latitude).toString());
      }
      if (row.Lng || row.lng || row.Long || row.long || row.Longitude || row.longitude) {
        lng = parseFloat((row.Lng || row.lng || row.Long || row.long || row.Longitude || row.longitude).toString());
      }

      // Use phone + countryCode as key to ensure uniqueness (same phone in different countries = different customers)
      const customerKey = `${phone}:${countryCode}`;
      if (!uniqueCustomers.has(customerKey)) {
        uniqueCustomers.set(customerKey, {
          name,
          phone,
          countryCode,
          address,
          lat,
          lng,
        });
      }
    });

    console.log(`🔍 [processCustomers] Processing ${uniqueCustomers.size} unique customers...`);

    // Process each customer
    for (const [customerKey, customerData] of uniqueCustomers.entries()) {
      const phone = customerData.phone;
      try {
        // If forceCreateNew is true, skip lookup and always create new customers
        if (forceCreateNew) {
          console.log(`🔄 [processCustomers] Force creating new customer (skipping lookup): ${customerData.name} (${phone})`);
        } else {
          // Step 1: Check if customer exists
          const lookupResponse = await getCustomerByPhoneAndType(
            customerData.phone,
            customerData.countryCode,
            2 // UserType = 2 for customers
          );

          if (lookupResponse.Status === 201 && lookupResponse.Object?.UserId) {
            // Customer exists - use existing customer
            customerMap.set(phone, lookupResponse.Object.UserId);
            existing++;
            console.log(`✅ [processCustomers] Customer exists: ${customerData.name} (${phone}) -> UserId: ${lookupResponse.Object.UserId}`);
            continue; // Skip creation, use existing customer
          }
        }

        // Customer doesn't exist OR forceCreateNew is true - create new customer
        console.log(`🔄 [processCustomers] Creating new customer: ${customerData.name} (${phone})`);

        // Generate placeholder email if not provided
        const placeholderEmail = `noemail-${Date.now()}-${Math.random().toString(36).substring(7)}@placeholder.local`;

        const createResponse = await createCustomer({
          Name: customerData.name,
          PhoneNumber: customerData.phone,
          CountryCode: customerData.countryCode,
          Email: placeholderEmail,
          Address: customerData.address || '',
          Lat: customerData.lat,
          Lng: customerData.lng,
          CompanyUserId: companyAdminId,
        });

        if (createResponse.Status === 201 || createResponse.Status === 200) {
          const newCustomerId =
            createResponse.CustomerId ||
            createResponse.Customer?.Id ||
            (createResponse.Customer as any)?.UserId;

          if (newCustomerId) {
            customerMap.set(phone, newCustomerId);
            created++;
            console.log(`✅ [processCustomers] Customer created: ${customerData.name} (${phone}) -> UserId: ${newCustomerId}`);
          } else {
            errors.push(
              `Failed to create customer ${customerData.name} (${phone}): No customer ID returned`
            );
            console.error(`❌ [processCustomers] Customer created but no ID returned:`, createResponse);
          }
        } else {
          // If customer creation fails, log but don't treat as fatal error
          // Backend import endpoint will handle customer creation
          const errorMsg = `Failed to create customer ${customerData.name} (${phone}): ${createResponse.Message || 'Unknown error'}. Backend import will handle customer creation.`;
          errors.push(errorMsg);
          console.warn(`⚠️ [processCustomers] Frontend customer creation failed (non-fatal):`, {
            customer: customerData.name,
            phone: phone,
            response: createResponse,
            note: 'Backend import endpoint will create customers automatically'
          });
        }
      } catch (error: any) {
        errors.push(`Error processing customer ${customerData.name} (${phone}): ${error.message}`);
        console.error(`❌ [processCustomers] Error processing customer:`, error);
      }
    }

    console.log(`✅ [processCustomers] Customer processing complete:`, {
      total: uniqueCustomers.size,
      created,
      existing,
      errors: errors.length,
      note: errors.length > 0 ? 'Some customers failed to create on frontend - backend import will handle them' : 'All customers processed successfully'
    });

    // Return success even if some customers failed - backend import will handle customer creation
    // This allows the import to proceed even if frontend customer creation endpoint doesn't exist
    return {
      success: true, // Always return success - backend import endpoint handles customer creation
      customerMap,
      errors,
      created,
      existing,
    };
  } catch (error: any) {
    console.error('❌ [processCustomers] Fatal error:', error);
    return {
      success: false,
      customerMap: new Map(),
      errors: [`Fatal error: ${error.message}`],
      created: 0,
      existing: 0,
    };
  }
}

/**
 * Import Service Requests from a file (bulk import)
 * Enhanced workflow:
 * 1. Validates services exist
 * 2. Creates customers if they don't exist
 * 3. Creates service requests with proper customer IDs
 * 
 * POST /ServiceRequests/import
 * Content-Type: multipart/form-data
 * Form-data key: file
 * 
 * @param formData - FormData object containing the file with key 'file'
 * @param companyAdminId - Company admin ID for validation and customer creation
 * @param skipValidation - Skip validation step (for testing)
 */
export async function importServiceRequests(
  formData: FormData,
  companyAdminId?: number,
  skipValidation: boolean = false
): Promise<{
  Status: number;
  Message?: string;
  data?: {
    success: number;
    errors?: string[];
    validation?: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
      serviceValidation: { serviceName: string; exists: boolean; serviceId?: number }[];
    };
    customerProcessing?: {
      created: number;
      existing: number;
      errors: string[];
    };
  };
}> {
  try {
    // Get companyAdminId from cookies if not provided
    let finalCompanyAdminId = companyAdminId;
    if (!finalCompanyAdminId) {
      // Try to get from user session (this would need to be passed from client)
      // For now, we'll require it to be passed
      console.warn('⚠️ [importServiceRequests] companyAdminId not provided. Customer creation may fail.');
    }

    // Use custom axios instance for service requests (may point to dev environment)
    const serviceRequestsAPI = await createServiceRequestsAxios();
    const baseURL = getServiceRequestsApiUrl();

    // Try different possible endpoint paths (backend might use different naming)
    // We prioritize /ServiceRequests/import as this semantic implies creating requests WITHOUT auto-booking
    // /ApprovedUserCredits/import often implies "Ready for Booking" which triggers auto-conversion
    const endpointsToTry = [
      '/ServiceRequests/import', // Priority 1: Semantic match for "Import Requests"
      '/ApprovedUserCredits/import', // Priority 2: Fallback
      '/ServiceRequest/import',
      '/import',
    ];

    // CRITICAL: Prevent auto-conversion to bookings. 
    // We append these to FormData to ensure the backend receives them regardless of query param parsing.
    formData.append('autoConvert', 'false');
    formData.append('createBookings', 'false');
    formData.append('createAppointment', 'false');
    formData.append('keepAsPending', 'true');
    formData.append('Status', 'Approved');
    formData.append('status', 'Approved');
    formData.append('skipGenerateBookings', 'true');

    // CRITICAL: Force creation of new customers instead of matching existing ones
    formData.append('forceCreateNewCustomers', 'true');
    formData.append('createNewCustomers', 'true');

    // Add companyAdminId if provided
    if (finalCompanyAdminId) {
      formData.append('companyAdminId', finalCompanyAdminId.toString());
    }

    let apiResponse = null;
    let successEndpoint = '';

    // Loop through endpoints until one works or we run out
    for (const endpoint of endpointsToTry) {
      try {
        console.log(`Trying import endpoint: ${endpoint}`);

        // Add flags to query params too (redundancy is safety here)
        const endpointWithParams = `${endpoint}?autoConvert=false&createBookings=false&createAppointment=false&keepAsPending=true&Status=Approved&skipGenerateBookings=true&companyAdminId=${finalCompanyAdminId || ''}`;

        // For FormData, let axios set Content-Type header with boundary automatically
        // We use the custom serviceRequestsAPI instance which handles auth headers
        apiResponse = await serviceRequestsAPI.post(endpointWithParams, formData);

        successEndpoint = endpoint;
        console.log(`✅ Import successful on endpoint: ${endpoint}`);
        break; // Stop if successful
      } catch (error: any) {
        // If 404, try next endpoint
        if (error.response?.status === 404) {
          console.warn(`Endpoint ${endpoint} not found (404), trying next...`);
          continue;
        }
        // If other error (500, 400, etc), throw it immediately
        // We don't want to retry on logic errors to avoid partial data corruption
        throw error;
      }
    }

    if (!apiResponse) {
      throw new Error('All import endpoints failed or not found (404).');
    }

    // Construct standardized response
    // The backend might return { Status: 201, Message: "...", data: ... } or just the data
    const responseData = apiResponse.data || {};
    const status = responseData.Status || apiResponse.status; // Prefer backend status, fallback to HTTP status
    const message = responseData.Message || responseData.message || (status >= 200 && status < 300 ? 'Import successful' : 'Import failed');

    // Normalize returned data payload
    // If responseData has .data or .Object wrapper, use that. Otherwise use responseData itself.
    const internalData = responseData.data || responseData.Object || responseData;

    console.log('✅ Import completed via', successEndpoint, 'Status:', status);

    return {
      Status: status,
      Message: message,
      data: internalData
    };
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
    });

    // Handle redirects (HTTP to HTTPS, etc.)
    if (
      err.response?.status === 301 ||
      err.response?.status === 302 ||
      err.response?.status === 307 ||
      err.response?.status === 308
    ) {
      const redirectLocation = err.response?.headers?.location;
      const attemptedUrl = err.config ? `${err.config.baseURL}${err.config.url}` : 'unknown';
      console.error('🔄 Redirect detected:', {
        from: attemptedUrl,
        to: redirectLocation,
        status: err.response?.status,
      });
      return {
        Status: err.response?.status,
        Message: `Backend redirected request from ${attemptedUrl} to ${redirectLocation || 'unknown location'}. This may indicate the dev backend requires HTTPS or a different URL.`,
      };
    }

    // Handle 404 specifically
    if (err.response?.status === 404) {
      const attemptedUrl = err.config ? `${err.config.baseURL}${err.config.url}` : '/ServiceRequests/import';
      return {
        Status: 404,
        Message: `Import endpoint not found at ${attemptedUrl}. Please verify with the backend developer the exact endpoint path. Common paths: /ServiceRequests/import, /ServiceRequest/import, or /import`,
      };
    }

    // Handle timeout
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return {
        Status: 408,
        Message: `Import request timed out. The dev backend (${err.config?.baseURL || 'unknown'}) may be slow or unresponsive. Please try again or contact the backend developer.`,
      };
    }

    // Handle network errors
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return {
        Status: 503,
        Message: `Cannot connect to dev backend (${err.config?.baseURL || 'unknown'}). Please verify the backend is running and accessible.`,
      };
    }

    // Handle other HTTP errors
    if (err.response) {
      const status = err.response.status || 500;
      const responseData = err.response.data;

      // Try to extract message from response
      let errorMessage = 'Failed to import service requests';
      if (typeof responseData === 'string') {
        errorMessage = responseData;
      } else if (responseData?.Message) {
        errorMessage = responseData.Message;
      } else if (responseData?.message) {
        errorMessage = responseData.message;
      } else if (err.response.statusText) {
        errorMessage = err.response.statusText;
      }

      return { Status: status, Message: errorMessage };
    }

    // Network or other errors
    const errorMessage = err.message || 'Failed to import service requests';
    return { Status: 500, Message: errorMessage };
  }
}
