import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
} from "axios";
import { cookies } from "next/headers";
import https from "https";

// Function to get API base URL - read at runtime to ensure env var is available
function getApiBaseUrl(): string {
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
      note: 'Legacy NEXT_PUBLIC_SERVICE_REQUESTS_API_URL also supported for backward compatibility',
      devUrl: cleanDevUrl || 'not set',
      legacyDevUrl: cleanLegacyDevUrl || 'not set',
      prodUrl: cleanProdUrl || 'not set'
    });
    throw new Error(errorMsg);
  }

  // Dev environment is configured - use it
  // Remove trailing slash (axios handles it correctly with paths starting with /)
  let baseUrl = finalDevUrl.replace(/\/+$/, '');

  // CRITICAL: Upgrade to HTTPS for the known dev domain which supports HTTPS.
  // This avoids Mixed Content issues when the client receives these URLs
  if (baseUrl.startsWith('http://gw5cndev.geowise.ai')) {
    baseUrl = baseUrl.replace('http://', 'https://');
  }

  if (typeof window === 'undefined') {
    console.warn('✅ Using DEV API Base URL:', baseUrl);
    console.warn('📋 Dev Environment Configuration:', {
      requested: finalDevUrl,
      resolved: baseUrl,
      environment: 'DEV',
      protocol: baseUrl.startsWith('https') ? 'HTTPS ✅' : 'HTTP ⚠️'
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

    // For dev environment, handle SSL certificate verification issues
    // The dev backend may use a self-signed certificate or certificate not in Node.js CA store
    const isDevEnvironment = this.baseURL.includes('gw5cndev') || this.baseURL.includes('localhost');
    const httpsAgent = isDevEnvironment
      ? new https.Agent({
        rejectUnauthorized: false // Only for dev - allows self-signed certs
      })
      : undefined;

    this.instance = axios.create({
      baseURL: this.baseURL,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json", // Explicitly request JSON responses
        "X-Requested-With": "XMLHttpRequest", // Tell backend this is an AJAX request (prevents HTML redirects)
      },
      timeout: 60000, // 60 second timeout
      ...(httpsAgent && { httpsAgent })
    });

    // Log the actual URL being used - use console.warn so it's visible in production
    console.warn('🚀 ServerAxiosConfig created with baseURL:', this.baseURL, {
      isDevEnvironment,
      hasHttpsAgent: !!httpsAgent
    });

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
          console.error('⏱️ Request timed out after 60 seconds. The backend API may be slow or unresponsive.');
          error.message = 'Request timeout: The backend API took too long to respond (60 seconds). Please try again or contact support if the issue persists.';
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
