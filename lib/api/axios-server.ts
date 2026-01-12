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
  
  // Log for debugging (server-side only)
  if (typeof window === 'undefined') {
    console.log('🔍 API Configuration:', {
      envVar: envUrl,
      hasEnvVar: !!envUrl,
      nodeEnv: process.env.NODE_ENV
    });
  }
  
  // Validate that we have a proper API URL
  if (!envUrl || envUrl.includes('localhost') || envUrl.includes('netlify.app')) {
    const errorMsg = `Invalid API URL: ${envUrl}. NEXT_PUBLIC_API_URL must be set to the backend API URL (e.g., https://gw5cn.geowise.ai)`;
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }
  
  // Remove trailing slash and ensure no /api suffix
  let baseUrl = envUrl.replace(/\/+$/, '').replace(/\/api$/, '');
  
  if (typeof window === 'undefined') {
    console.log('✅ Using API Base URL:', baseUrl);
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
      timeout: 60000, // 60 second timeout for all requests
    });

    // Log the actual URL being used
    console.log('🚀 ServerAxiosConfig created with baseURL:', this.baseURL);

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
        // Log the full URL being called
        const fullUrl = `${this.baseURL}${config.url}`;
        console.log('📡 Making API request:', {
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
        // Log error details
        console.error('❌ API Request failed:', {
          url: error.config?.url,
          fullUrl: error.config ? `${this.baseURL}${error.config.url}` : 'unknown',
          status: error.response?.status,
          message: error.message,
          baseURL: this.baseURL
        });
        
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
