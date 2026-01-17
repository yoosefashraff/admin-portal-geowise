"use server";

import { cookies } from "next/headers";
import { LoginRequest } from "@/lib/types/auth.types";
import serverAPI from "../api/axios-server";
import axios from "axios";
import https from "https";

// Get API URL - use dev environment if configured (same as other actions)
function getLoginApiUrl(): string {
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
    console.error('❌ Production API disabled for login:', {
      reason: 'Production API usage is disabled for testing',
      requiredEnvVar: 'NEXT_PUBLIC_DEV_API_URL',
      action: 'Set NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai',
      note: 'Legacy NEXT_PUBLIC_SERVICE_REQUESTS_API_URL also supported for backward compatibility'
    });
    throw new Error(errorMsg);
  }
  
  // Remove trailing slash
  return finalDevUrl.replace(/\/+$/, '');
}

export async function loginAction(data: LoginRequest) {
  const API = getLoginApiUrl();
  const isUsingDev = !!(process.env.NEXT_PUBLIC_DEV_API_URL || process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL);
  
  console.warn('🔐 Login Action - Using API:', {
    environment: 'DEV',
    apiUrl: API,
    devUrl: process.env.NEXT_PUBLIC_DEV_API_URL || process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL || 'not set',
    note: 'Login will authenticate against DEV backend'
  });
  
  if (!API) {
    const errorMsg = "❌ Dev environment not configured. Please set NEXT_PUBLIC_DEV_API_URL to use dev backend.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  // Validate API URL is not pointing to frontend (only for production)
  // Note: This check is now redundant since we require dev environment, but keeping for safety
  if (!isUsingDev && (API.includes('netlify.app') || API.includes('localhost'))) {
    const errorMsg = `❌ Invalid API URL: "${API}". API URL must point to a valid backend, not the frontend URL.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const loginUrl = `${API}/company/userlogin`;
    console.error('🔐 Attempting login to:', {
      url: loginUrl,
      environment: isUsingDev ? 'DEV' : 'PRODUCTION',
      apiUrl: API
    });
    
    // Use axios instead of fetch for better SSL certificate handling (especially for dev environment)
    // Configure axios to handle self-signed certificates for dev environment
    const httpsAgent = isUsingDev 
      ? new https.Agent({
          rejectUnauthorized: false // Only for dev - allows self-signed certs
        })
      : undefined;
    
    const axiosConfig: any = {
      method: 'POST',
      url: loginUrl,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      data: data,
      timeout: 30000, // 30 second timeout
      ...(httpsAgent && { httpsAgent })
    };
    
    let axiosResponse: any;
    try {
      axiosResponse = await axios(axiosConfig);
    } catch (axiosError: any) {
      console.error('❌ Login axios error:', {
        errorName: axiosError.name,
        errorMessage: axiosError.message,
        errorCode: axiosError.code,
        url: loginUrl,
        environment: isUsingDev ? 'DEV' : 'PRODUCTION',
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText
      });
      
      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        throw new Error("Request timeout. Please check your internet connection and try again.");
      }
      if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ERR_NETWORK') {
        const errorMsg = isUsingDev 
          ? `Unable to connect to dev backend (${API}). Please verify the backend is running and accessible. Error: ${axiosError.message || axiosError.code}`
          : "Unable to connect to the server. Please check your API URL configuration.";
        throw new Error(errorMsg);
      }
      if (axiosError.message?.includes('certificate') || axiosError.code === 'CERT_HAS_EXPIRED' || axiosError.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        throw new Error(`SSL certificate error when connecting to ${API}. This might be a self-signed certificate issue. Error: ${axiosError.message}`);
      }
      // If we got a response but it's an error status, handle it below
      if (axiosError.response) {
        axiosResponse = axiosError.response;
      } else {
        throw new Error(axiosError.message || "Network error occurred. Please try again.");
      }
    }
    
    // Convert axios response to fetch-like response format for compatibility
    const res = {
      ok: axiosResponse.status >= 200 && axiosResponse.status < 300,
      status: axiosResponse.status,
      statusText: axiosResponse.statusText,
      headers: {
        get: (name: string) => axiosResponse.headers[name.toLowerCase()] || axiosResponse.headers[name]
      },
      json: async () => axiosResponse.data,
      text: async () => JSON.stringify(axiosResponse.data)
    } as Response;

    // Handle response - axios already parsed JSON
    let json: any = {};
    const contentType = res.headers.get("content-type");
    
    try {
      json = await res.json();
      console.error('🔐 Login response received:', {
        status: res.status,
        ok: res.ok,
        hasCookie: !!json.Cookie,
        cookieLength: json.Cookie?.length || 0,
        responseKeys: Object.keys(json),
        message: json.Message || json.message,
        environment: isUsingDev ? 'DEV' : 'PRODUCTION'
      });
    } catch (parseError) {
      const text = await res.text().catch(() => "Unable to read response");
      console.error('❌ Failed to parse login response:', {
        status: res.status,
        contentType,
        textPreview: text.substring(0, 200),
        environment: isUsingDev ? 'DEV' : 'PRODUCTION'
      });
      throw new Error(`Invalid JSON response from server: ${text.substring(0, 200)}`);
    }

    if (!res.ok) {
      const errorMessage = json.message || json.Message || json.error || json.Error || `Login failed with status ${res.status}`;
      console.error('❌ Login failed:', {
        status: res.status,
        statusText: res.statusText,
        errorMessage,
        response: json,
        environment: isUsingDev ? 'DEV' : 'PRODUCTION'
      });
      throw new Error(errorMessage);
    }

    // Ensure we have a cookie value
    if (!json.Cookie) {
      console.error('❌ No cookie in login response:', {
        status: res.status,
        responseKeys: Object.keys(json),
        responsePreview: JSON.stringify(json).substring(0, 500),
        environment: isUsingDev ? 'DEV' : 'PRODUCTION'
      });
      throw new Error("No authentication cookie received from server. Please check your credentials.");
    }

    try {
      const cookieStore = await cookies();

      // Delete existing cookie first to ensure new attributes are applied
      // This is important if cookie was previously set with different attributes
      try {
        cookieStore.delete("xyzCompAuthorize");
      } catch (deleteError) {
        // Ignore delete errors (cookie might not exist)
      }

      // Set cookie with 30 days expiration for persistent login
      const maxAge = 60 * 60 * 24 * 30; // 30 days in seconds

      cookieStore.set({
        name: "xyzCompAuthorize",
        value: json.Cookie,
        path: "/",
        httpOnly: false,
        sameSite: "none", // Required for cross-origin requests (Netlify → backend)
        secure: true, // Required when sameSite is "none" on HTTPS
        maxAge: maxAge,
      });
      
      console.warn('🍪 Cookie set server-side:', {
        name: 'xyzCompAuthorize',
        hasValue: !!json.Cookie,
        valueLength: json.Cookie?.length || 0,
        attributes: 'sameSite=none; secure=true',
        note: 'Client-side will also set cookie to ensure Secure flag is applied'
      });
    } catch (cookieError: any) {
      // Log error but don't fail login - client-side will handle it
      console.error('⚠️ Server-side cookie setting failed (client-side will handle):', {
        error: cookieError.message,
        note: 'Client-side cookie setting will ensure Secure flag is set'
      });
    }

  return json;
  } catch (error: any) {
    // Ensure error is serializable for Server Actions
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : "An unexpected error occurred during login";
    
    throw new Error(errorMessage);
  }
}

export async function getCurrentUserAction() : Promise<{Status : number, Message : string, Object ?: string}> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("xyzCompAuthorize");
    
    if (!cookie?.value) {
      return {Status : 401, Message : "No authentication cookie found"};
    }

    const response : {Object : string, Status : number, Message : string} = await serverAPI.get('/company/getcompanyname');
    return response;
  } catch (err: any) {
    console.error("Get current user error:", err);
    const errorMessage = err.response?.statusText || err.message || "Authentication check failed";
    return {Status : 500, Message : errorMessage};
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  // const cookie = cookieStore.get("xyzCompAuthorize")?.value ?? "";
  //
  // await fetch(`${API}/auth/logout`, {
  //   method: "POST",
  //   headers: {
  //     "xyzCompAuthorize": cookie,
  //   },
  // });

  cookieStore.delete("xyzCompAuthorize");
}
