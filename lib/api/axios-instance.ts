import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Client-side API URL validation
function getClientApiUrl(): string {
  // Check for dev environment first (NEW - applies to whole app)
  const devUrl = process.env.NEXT_PUBLIC_DEV_API_URL;
  // Backward compatibility with old variable name
  const legacyDevUrl = process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL;
  const prodUrl = process.env.NEXT_PUBLIC_API_URL;

  // Remove quotes if present (common mistake in .env files)
  const cleanDevUrl = devUrl ? devUrl.replace(/^["']|["']$/g, '').trim() : undefined;
  const cleanLegacyDevUrl = legacyDevUrl ? legacyDevUrl.replace(/^["']|["']$/g, '').trim() : undefined;
  const cleanProdUrl = prodUrl ? prodUrl.replace(/^["']|["']$/g, '').trim() : undefined;

  // Use dev environment if set (new variable takes precedence over legacy)
  const finalDevUrl = cleanDevUrl || cleanLegacyDevUrl;

  // Determine which API to use
  // Netlify deployments should use dev API
  // Local development should use dev API
  // Company server deployments should use production API
  const isDevelopment = typeof window !== 'undefined' 
    ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    : process.env.NODE_ENV === 'development';
  
  const isNetlify = typeof window !== 'undefined' 
    ? window.location.hostname.includes('netlify.app')
    : false;

  let baseUrl: string;

  if (finalDevUrl) {
    // Dev environment is configured - use it (for local dev and Netlify)
    baseUrl = finalDevUrl.replace(/\/+$/, '');
  } else if (isNetlify || isDevelopment) {
    // Netlify or local development but no dev API configured - throw error
    const errorMsg = 'Dev environment not configured. Please set NEXT_PUBLIC_DEV_API_URL to use dev backend.';
    console.error('❌ API not configured:', {
      reason: 'No dev API URL configured',
      requiredEnvVar: 'NEXT_PUBLIC_DEV_API_URL',
      action: 'Set NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai',
      environment: isNetlify ? 'Netlify (requires dev API)' : 'Local development'
    });
    if (typeof window !== 'undefined') {
      throw new Error(errorMsg);
    }
    throw new Error(errorMsg);
  } else if (cleanProdUrl) {
    // Company server production deployment - use production API
    baseUrl = cleanProdUrl.replace(/\/+$/, '');
    if (typeof window !== 'undefined') {
      console.warn('⚠️ Using production API (for company server deployment):', baseUrl);
    }
  } else {
    // No API configured at all
    throw new Error('API URL not configured. Set NEXT_PUBLIC_DEV_API_URL for Netlify/local dev or NEXT_PUBLIC_API_URL for company server production.');
  }

  // In local development, use Next.js proxy to avoid CORS issues
  // The proxy is configured in next.config.js to rewrite /api/* to the backend
  if (isDevelopment && typeof window !== 'undefined') {
    // Use relative path to leverage Next.js proxy
    return '/api';
  }

  // CRITICAL: Upgrade to HTTPS if running on a secure domain (like Netlify) 
  // or if using the known dev domain which supports HTTPS.
  if (baseUrl.startsWith('http://gw5cndev.geowise.ai')) {
    baseUrl = baseUrl.replace('http://', 'https://');
  } else if (typeof window !== 'undefined' && window.location.protocol === 'https:' && baseUrl.startsWith('http://')) {
    // If we're on an HTTPS page, we MUST use HTTPS for the API to avoid Mixed Content errors
    baseUrl = baseUrl.replace('http://', 'https://');
  }

  // Log only in local dev (not on Netlify/production) to avoid console noise
  const isLocalDev = typeof window !== 'undefined' &&
    process.env.NODE_ENV === 'development' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (isLocalDev) {
    console.warn('🔍 Client-side API using environment:', {
      requested: finalDevUrl || cleanProdUrl || 'not set',
      resolved: baseUrl,
      environment: finalDevUrl ? 'DEV' : 'PRODUCTION',
      deployment: 'Local Dev (using proxy)',
      protocol: baseUrl.startsWith('https') ? 'HTTPS ✅' : baseUrl === '/api' ? 'Next.js Proxy ✅' : 'HTTP ⚠️'
    });
  }

  return baseUrl;
}

const API_BASE_URL = getClientApiUrl();

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 second timeout
  withCredentials: true, // Important: sends cookies with requests
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json"
  }
});

// Request interceptor for logging in development
axiosInstance.interceptors.request.use(
  (config) => {
    // Log requests in development
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.log('📤 Client API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullUrl: `${config.baseURL}${config.url}`,
        hasCredentials: config.withCredentials,
      });
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;

    // Handle network errors (CORS should be resolved, but log if issues persist)
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
      console.error('🚫 Network Error (CORS should be resolved - check backend if this persists):', {
        origin,
        target: error.config?.url ? `${error.config.baseURL}${error.config.url}` : 'unknown',
        message: 'If CORS errors persist, verify backend CORS configuration includes this origin'
      });
    }

    if (status === 401 || status === 403) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error.response?.data || error.message);
  }
);

export const apiClient = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    axiosInstance.get(url, config).then(res => res.data),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    axiosInstance.post(url, data, config).then(res => res.data),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    axiosInstance.put(url, data, config).then(res => res.data),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    axiosInstance.patch(url, data, config).then(res => res.data),

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    axiosInstance.delete(url, config).then(res => res.data),
};

export default axiosInstance;