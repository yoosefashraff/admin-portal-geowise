import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
} from "axios";
import { cookies } from "next/headers";

// Function to get API base URL - read at runtime to ensure env var is available
function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // Log for debugging (server-side only) - use console.warn so it's visible in production
  if (typeof window === 'undefined') {
    console.warn('🔍 API Configuration Check:', {
      envVar: envUrl,
      hasEnvVar: !!envUrl,
      nodeEnv: process.env.NODE_ENV,
      isLocalhost: envUrl?.includes('localhost'),
      isNetlify: envUrl?.includes('netlify.app'),
      isGeowise: envUrl?.includes('geowise.ai')
    });
  }
  
  // Strict validation - must be set and must point to backend
  if (!envUrl) {
    const errorMsg = `❌ NEXT_PUBLIC_API_URL is not set! Please set it to the backend API URL (e.g., https://gw5cn.geowise.ai) in Netlify environment variables.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  // Check for invalid URLs (localhost, netlify frontend, etc.)
  const invalidPatterns = ['localhost', 'netlify.app', '127.0.0.1', '0.0.0.0'];
  const hasInvalidPattern = invalidPatterns.some(pattern => envUrl.toLowerCase().includes(pattern));
  
  if (hasInvalidPattern) {
    const errorMsg = `❌ Invalid API URL: "${envUrl}". NEXT_PUBLIC_API_URL must be set to the backend API URL (https://gw5cn.geowise.ai), not the frontend URL. Current value appears to be pointing to: ${envUrl.includes('netlify.app') ? 'Netlify frontend' : 'localhost'}. Please check Netlify environment variables.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  // Ensure it's pointing to the correct backend domain
  if (!envUrl.includes('geowise.ai') && !envUrl.includes('gw5cn')) {
    console.warn('⚠️ WARNING: API URL does not appear to be the Geowise backend:', envUrl);
  }
  
  // Remove trailing slash and ensure no /api suffix
  let baseUrl = envUrl.replace(/\/+$/, '').replace(/\/api$/, '');
  
  if (typeof window === 'undefined') {
    console.warn('✅ Using API Base URL:', baseUrl);
    console.warn('📋 Full API configuration:', {
      originalEnvVar: envUrl,
      resolvedBaseUrl: baseUrl,
      isProduction: process.env.NODE_ENV === 'production'
    });
  }
  
  return baseUrl;
}

// ============================================================================
// Token Manager (Server-side)
// ============================================================================

class ServerTokenManager {
  private static readonly COOKIE_NAME = "xyzCompAuthorize";

  /**
   * Get access token from cookie xyzCompAuthorize
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      const cookieStore = await cookies();
      const cookie = cookieStore.get(this.COOKIE_NAME);
      
      // Log all cookies for debugging
      const allCookies = cookieStore.getAll();
      console.log('ServerTokenManager: All cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value, valueLength: c.value?.length || 0 })));
      
      if (!cookie?.value) {
        console.warn('ServerTokenManager: Cookie not found. Available cookies:', allCookies.map(c => c.name));
        return null;
      }
      
      console.log('ServerTokenManager: Cookie found, length:', cookie.value.length);
      return cookie.value;
    } catch (error) {
      console.error('ServerTokenManager: Error getting cookie:', error);
      return null;
    }
  }
}

// ============================================================================
// Server Axios Config
// ============================================================================

class ServerAxiosConfig {
  private instance: AxiosInstance;
  private accessToken?: string;
  private baseURL: string;

  private constructor(accessToken?: string) {
    this.accessToken = accessToken;
    this.baseURL = getApiBaseUrl(); // Get URL at runtime

    this.instance = axios.create({
      baseURL: this.baseURL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 25000, // 25 second timeout (Netlify functions timeout at 30s, so we need to fail earlier)
    });

    // Log the actual URL being used - use console.warn so it's visible in production
    console.warn('🚀 ServerAxiosConfig created with baseURL:', this.baseURL);

    this.setupInterceptors();
  }

  /**
   * Create instance with cookies
   */
  static async create(): Promise<ServerAxiosConfig> {
    const accessToken = await ServerTokenManager.getAccessToken();
    return new ServerAxiosConfig(accessToken || undefined);
  }

  /**
   * Setup interceptors
   */
  private setupInterceptors(): void {
    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  /**
   * Setup request interceptor - add token to header and log requests
   */
  private setupRequestInterceptor(): void {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Log the full URL being called - use console.warn so it's visible in production
        const fullUrl = `${this.baseURL}${config.url}`;
        console.warn('📡 Making API request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          fullUrl: fullUrl,
          baseURL: this.baseURL
        });

        if (this.accessToken && config.headers) {
          config.headers.Cookie = `xyzCompAuthorize=${this.accessToken}`;
        } else {
          console.warn('⚠️ No access token available for request:', config.url);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Setup response interceptor - return data directly
   */
  private setupResponseInterceptor(): void {
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Check if response is HTML (likely a redirect to login page)
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('text/html')) {
          console.warn('Server returned HTML (likely redirect to login):', {
            url: response.config.url,
            status: response.status,
            statusText: response.statusText
          });
          // Return HTML as string so we can detect it
          return response.data;
        }
        return response.data;
      },
      (error) => {
        // Check if it's a timeout error
        const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
        
        // Log error details
        console.error('❌ API Request failed:', {
          url: error.config?.url,
          fullUrl: error.config ? `${this.baseURL}${error.config.url}` : 'unknown',
          status: error.response?.status,
          message: error.message,
          code: error.code,
          isTimeout: isTimeout,
          baseURL: this.baseURL
        });
        
        // Enhance timeout error message
        if (isTimeout) {
          console.error('⏱️ Request timed out after 25 seconds. The backend API may be slow or unresponsive.');
          error.message = 'Request timeout: The backend API took too long to respond. Please try again or contact support if the issue persists.';
        }
        
        // Check if error is a redirect (3xx status)
        if (error.response && error.response.status >= 300 && error.response.status < 400) {
          console.warn('⚠️ Server redirected (likely to login page):', {
            url: error.config?.url,
            status: error.response.status,
            location: error.response.headers?.location
          });
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get axios instance
   */
  public getAxiosInstance(): AxiosInstance {
    return this.instance;
  }

  /**
   * Get current token
   */
  public getToken() {
    return this.accessToken;
  }
}

// ============================================================================
// Exports
// ============================================================================

/**
 * Server API Client with async methods
 */
export const serverAPI = {
  async get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const client = await createServerAxios();
    return client.get(url, config);
  },

  async post<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<T> {
    const client = await createServerAxios();
    return client.post(url, data, config);
  },

  async put<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<T> {
    const client = await createServerAxios();
    return client.put(url, data, config);
  },

  async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const client = await createServerAxios();
    return client.delete(url, config);
  },

  async patch<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<T> {
    const client = await createServerAxios();
    return client.patch(url, data, config);
  },
};

/**
 * Create server axios instance - return axios instance directly
 */
async function createServerAxios(): Promise<AxiosInstance> {
  const config = await ServerAxiosConfig.create();
  return config.getAxiosInstance();
}

// Export ServerTokenManager for debugging purposes
export { ServerTokenManager };

export default serverAPI;
