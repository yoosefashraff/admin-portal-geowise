"use server";

import { cookies } from "next/headers";
import { LoginRequest } from "@/lib/types/auth.types";
import serverAPI from "../api/axios-server";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function loginAction(data: LoginRequest) {
  if (!API) {
    throw new Error("API URL is not configured");
  }

  try {
    const res = await fetch(`${API}/company/userlogin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
    });

    // Handle non-JSON responses
    let json: any = {};
    const contentType = res.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      json = await res.json().catch(() => ({}));
    } else {
      const text = await res.text();
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

    const cookieStore = await cookies();

    cookieStore.set({
      name: "xyzCompAuthorize",
      value: json.Cookie,
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return json;
  } catch (error: any) {
    // Re-throw with a more user-friendly message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(error?.message || "An unexpected error occurred during login");
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
