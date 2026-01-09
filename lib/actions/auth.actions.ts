"use server";

import { cookies } from "next/headers";
import { LoginRequest } from "@/lib/types/auth.types";
import serverAPI from "../api/axios-server";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function loginAction(data: LoginRequest) {
  try {
    const res = await fetch(`${API}/company/userlogin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(json.message || json.Message || "Login failed");
    }

    // Ensure we have a cookie value
    if (!json.Cookie) {
      throw new Error("No authentication cookie received from server");
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
    console.error("Login action error:", error);
    throw error;
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
