import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import https from 'https';

/**
 * API Proxy Route Handler
 * 
 * This route proxies all /api/* requests to the backend API,
 * forwarding cookies and headers properly.
 * 
 * Usage: /api/company/getservices -> proxies to backend
 */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const params = await Promise.resolve(context.params);
  return handleProxyRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const params = await Promise.resolve(context.params);
  return handleProxyRequest(request, params, 'POST');
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const params = await Promise.resolve(context.params);
  return handleProxyRequest(request, params, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const params = await Promise.resolve(context.params);
  return handleProxyRequest(request, params, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const params = await Promise.resolve(context.params);
  return handleProxyRequest(request, params, 'DELETE');
}

async function handleProxyRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    // Get backend URL from environment
    const devUrl = process.env.NEXT_PUBLIC_DEV_API_URL || process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL;
    const prodUrl = process.env.NEXT_PUBLIC_API_URL;
    
    // CONFIRMATION: Log which environment is being used
    console.log('🔍 Proxy Environment Check:', {
      NEXT_PUBLIC_DEV_API_URL: process.env.NEXT_PUBLIC_DEV_API_URL || 'not set',
      NEXT_PUBLIC_SERVICE_REQUESTS_API_URL: process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL || 'not set',
      NEXT_PUBLIC_API_URL: prodUrl || 'not set',
      selectedDevUrl: devUrl || 'not set',
      environment: devUrl ? 'DEV ✅' : 'PRODUCTION ⚠️',
      note: 'Services will be fetched from DEV environment'
    });
    
    if (!devUrl) {
      console.error('❌ DEV API URL not configured - cannot proxy to dev environment');
      return NextResponse.json(
        { error: 'Backend API URL not configured', message: 'NEXT_PUBLIC_DEV_API_URL is required for local development' },
        { status: 500 }
      );
    }

    // Build the backend URL
    const path = params.path.join('/');
    const backendUrl = `${devUrl.replace(/\/+$/, '')}/${path}`;
    
    // Get query string from request
    const searchParams = request.nextUrl.searchParams.toString();
    const fullBackendUrl = searchParams 
      ? `${backendUrl}?${searchParams}`
      : backendUrl;
    
    // CONFIRMATION: Log the exact backend URL being used
    console.log('✅ Confirmed: Using DEV environment backend:', {
      devApiUrl: devUrl,
      fullBackendUrl: fullBackendUrl,
      path: path,
      environment: 'DEV',
      note: 'All services are fetched from dev environment'
    });

    // Get authentication cookie from Next.js cookies
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('xyzCompAuthorize');
    
    // Also check for cookie in the incoming request (client might send it)
    const incomingCookie = request.headers.get('cookie');
    
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Forward authentication cookie - prefer server-side cookie, fallback to incoming cookie
    if (authCookie?.value) {
      headers['Cookie'] = `xyzCompAuthorize=${authCookie.value}`;
      console.log('🔐 Proxy: Using server-side cookie for authentication');
    } else if (incomingCookie) {
      // Forward the entire cookie header from the client
      headers['Cookie'] = incomingCookie;
      console.log('🔐 Proxy: Forwarding client cookie header');
    } else {
      console.warn('⚠️ Proxy: No authentication cookie found');
    }

    // Get request body for POST/PUT/PATCH
    let body: string | FormData | undefined;
    const contentType = request.headers.get('content-type') || '';
    
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (contentType.includes('multipart/form-data')) {
        // Handle FormData (file uploads)
        body = await request.formData();
        // Remove Content-Type header - fetch will set it with boundary
        delete headers['Content-Type'];
      } else if (contentType.includes('application/json')) {
        // Handle JSON
        try {
          const requestBody = await request.json();
          body = JSON.stringify(requestBody);
        } catch {
          // If JSON parsing fails, try as text
          body = await request.text();
        }
      } else {
        // Handle other content types (text, etc.)
        try {
          body = await request.text();
        } catch {
          // No body
        }
      }
    }

    console.log('🔄 Proxying request to DEV environment:', {
      method,
      from: `/api/${path}`,
      to: fullBackendUrl,
      devApiBase: devUrl,
      hasAuthCookie: !!(authCookie?.value || incomingCookie),
      environment: 'DEV ✅',
      confirmation: 'Services fetched from: ' + devUrl
    });

    // Use axios instead of fetch to support custom SSL agents
    // This handles self-signed certificates in dev environment
    const isDevEnvironment = fullBackendUrl.includes('gw5cndev') || fullBackendUrl.includes('localhost');
    const httpsAgent = isDevEnvironment
      ? new https.Agent({
          rejectUnauthorized: false // Only for dev - allows self-signed certs
        })
      : undefined;

    try {
      const axiosResponse = await axios({
        method: method as any,
        url: fullBackendUrl,
        headers,
        data: body,
        httpsAgent,
        timeout: 60000,
        validateStatus: () => true, // Don't throw on any status code
      });

      // Log response for debugging
      if (axiosResponse.status >= 400) {
        console.error('❌ Proxy backend error (DEV environment):', {
          status: axiosResponse.status,
          statusText: axiosResponse.statusText,
          url: fullBackendUrl,
          devApiBase: devUrl,
          environment: 'DEV',
          response: axiosResponse.data,
        });
      } else {
        console.log('✅ Proxy request successful (DEV environment):', {
          status: axiosResponse.status,
          url: fullBackendUrl,
          devApiBase: devUrl,
          environment: 'DEV',
          confirmation: 'Response received from dev backend'
        });
      }

      // Return response with same status
      return NextResponse.json(axiosResponse.data, {
        status: axiosResponse.status,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (axiosError: any) {
      console.error('❌ Axios request failed:', {
        url: fullBackendUrl,
        method,
        error: axiosError.message,
        code: axiosError.code,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });
      
      // Return error response
      return NextResponse.json(
        { 
          error: 'Proxy request failed',
          message: axiosError.message || 'Failed to connect to backend',
          details: {
            url: fullBackendUrl,
            method,
            code: axiosError.code,
            status: axiosError.response?.status,
          }
        },
        { status: axiosError.response?.status || 502 }
      );
    }
  } catch (error: any) {
    console.error('❌ Proxy request failed:', {
      error: error.message,
      path: params.path,
      method,
    });
    
    return NextResponse.json(
      { 
        error: 'Proxy request failed',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
