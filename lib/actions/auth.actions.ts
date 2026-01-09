"use server";

import { cookies } from "next/headers";
import { LoginRequest } from "@/lib/types/auth.types";
import serverAPI from "../api/axios-server";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function loginAction(data: LoginRequest) {
  if (!API) {
    throw new Error("API URL is not configured. Please check your environment variables.");
  }

  try {
    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let res: Response;
    try {
      res = await fetch(`${API}/company/userlogin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error("Request timeout. Please check your internet connection and try again.");
      }
      if (fetchError.message?.includes('fetch')) {
        throw new Error("Unable to connect to the server. Please check your API URL configuration.");
      }
      throw new Error(fetchError.message || "Network error occurred. Please try again.");
    }

    // Handle non-JSON responses
    let json: any = {};
    const contentType = res.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      try {
        json = await res.json();
      } catch (parseError) {
        const text = await res.text().catch(() => "Unable to read response");
        throw new Error(`Invalid JSON response from server: ${text.substring(0, 200)}`);
      }
    } else {
      const text = await res.text().catch(() => "Unable to read response");
      throw new Error(text || `Login failed with status ${res.status}`);
    }

    if (!res.ok) {
      const errorMessage = json.message || json.Message || json.error || `Login failed with status ${res.status}`;
      throw new Error(errorMessage);
    }

    // Ensure we have a cookie value
    if (!json.Cookie) {
      throw new Error("No authentication cookie received from server. Please check your credentials.");
    }

    try {
      const cookieStore = await cookies();

      cookieStore.set({
        name: "xyzCompAuthorize",
        value: json.Cookie,
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        secure: false,
      });
    } catch (cookieError: any) {
      // Still return the response even if cookie setting fails
      // The client-side store will handle it
      // Log error but don't fail the login
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
