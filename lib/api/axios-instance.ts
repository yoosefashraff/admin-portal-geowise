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

  // CRITICAL: Require dev environment - do NOT fall back to production
  if (!finalDevUrl) {
    const errorMsg = 'Dev environment not configured. Please set NEXT_PUBLIC_DEV_API_URL to use dev backend.';
    console.error('❌ Production API disabled:', {
      reason: 'Production API usage is disabled for testing',
      requiredEnvVar: 'NEXT_PUBLIC_DEV_API_URL',
      action: 'Set NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai',
      note: 'Legacy NEXT_PUBLIC_SERVICE_REQUESTS_API_URL also supported for backward compatibility'
    });
    // In browser, throw error that can be caught by error boundary
    if (typeof window !== 'undefined') {
      throw new Error(errorMsg);
    }
    // On server, throw immediately
    throw new Error(errorMsg);
  }

  // Dev environment is configured - use it
  let baseUrl = finalDevUrl.replace(/\/+$/, '');

  // CRITICAL: Upgrade to HTTPS if running on a secure domain (like Netlify) 
  // or if using the known dev domain which supports HTTPS.
  if (baseUrl.startsWith('http://gw5cndev.geowise.ai')) {
    baseUrl = baseUrl.replace('http://', 'https://');
  } else if (typeof window !== 'undefined' && window.location.protocol === 'https:' && baseUrl.startsWith('http://')) {
    // If we're on an HTTPS page, we MUST use HTTPS for the API to avoid Mixed Content errors
    baseUrl = baseUrl.replace('http://', 'https://');
  }

  if (typeof window !== 'undefined') {
    console.warn('🔍 Client-side API using environment:', {
      requested: finalDevUrl,
      resolved: baseUrl,
      protocol: baseUrl.startsWith('https') ? 'HTTPS ✅' : 'HTTP ⚠️'
    });
  }

  return baseUrl;
}

const API_BASE_URL = getClientApiUrl();

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 second timeout
  withCredentials: true,
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json"
  }
});

axiosInstance.interceptors.request.use(
  (config) => {
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