import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Client-side API URL validation
function getClientApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // In development (localhost), use Next.js proxy to avoid CORS issues
  // In production, use direct backend URL (CORS is configured)
  if (typeof window !== 'undefined') {
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
      // Use relative path which will be proxied by Next.js rewrites
      return '/api';
    }
    
    // In production, validate the API URL
    if (envUrl) {
      if (envUrl.includes('localhost') || envUrl.includes('netlify.app')) {
        console.error('❌ Invalid API URL in client bundle:', envUrl);
        console.error('This indicates NEXT_PUBLIC_API_URL was set incorrectly during build.');
        console.error('Please rebuild with NEXT_PUBLIC_API_URL=https://gw5cn.geowise.ai');
      }
      return envUrl;
    }
  }
  
  // Fallback: use environment URL or default
  return envUrl || 'https://gw5cn.geowise.ai';
}

const API_BASE_URL = getClientApiUrl();

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
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

    // Handle CORS errors specifically
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
      console.error('🚫 CORS Error: Request blocked by browser CORS policy', {
        origin,
        target: error.config?.url ? `${error.config.baseURL}${error.config.url}` : 'unknown',
        message: 'The backend must allow CORS from this origin. Please verify backend CORS configuration includes:',
        requiredHeaders: [
          `Access-Control-Allow-Origin: ${origin}`,
          'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers: Content-Type, Authorization',
          'Access-Control-Allow-Credentials: true'
        ]
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