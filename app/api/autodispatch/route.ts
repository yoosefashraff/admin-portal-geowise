import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import https from "https";

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

export async function POST(req: NextRequest) {
  try {
    const { creditIds } = await req.json();

    if (!creditIds || !Array.isArray(creditIds) || creditIds.length === 0) {
      return NextResponse.json(
        { message: "CreditIds is required" },
        { status: 400 },
      );
    }

    const authorization = req.headers.get("authorization");
    const xyzToken = req.cookies.get("xyzCompAuthorize")?.value;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (authorization) {
      headers["Authorization"] = authorization;
    }

    if (xyzToken) {
      headers["X-xyzCompAuthorize"] = xyzToken;
      headers["Cookie"] = `xyzCompAuthorize=${xyzToken}`;
    }
    const devUrl = process.env.NEXT_PUBLIC_DEV_API_URL?.replace(
      /^["']|["']$/g,
      "",
    ).trim();
    const legacyDevUrl =
      process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL?.replace(
        /^["']|["']$/g,
        "",
      ).trim();
    const finalDevUrl = devUrl || legacyDevUrl || "";

    let baseUrl = finalDevUrl.replace(/\/+$/, "");

    const endpoint = "/ApprovedUserCredits/GenerateBookings";
    const fullUrl = `${baseUrl}${endpoint}`;    

    axios
      .post(
        fullUrl,
        { CreditIds: creditIds },
        {
          headers,
          httpsAgent,
          timeout: 0,
        },
      )
      .then((data) => {
        console.log("data AutoDispatch success:", data);
      })
      .catch((err) => {
        console.error("Background AutoDispatch failed:", err.message);
      });

    return NextResponse.json(
      {
        data: {
          success: true,
          Status: 201,
          message: "AutoDispatch started",
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("AutoDispatch proxy error:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
    });

    return NextResponse.json(
      {
        data: {
          success: true,
          Status: 500,
          message: "AutoDispatch failed",
          error: error.response?.data || error.message,
        },
      },
      { status: error.response?.status || 500 },
    );
  }
}
