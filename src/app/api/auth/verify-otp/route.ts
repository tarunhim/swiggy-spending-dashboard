import { NextRequest, NextResponse } from "next/server";
import { cookiesFromSetCookie, getSwiggyHeaders, mergeCookies } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { mobile, otp, deviceId, session } = await request.json();
    const sessionCookies = typeof session === "string" ? session : "";

    if (!mobile || !otp || !deviceId) {
      return NextResponse.json(
        { error: "Mobile, OTP, and device ID are required" },
        { status: 400 }
      );
    }

    const response = await fetch("https://www.swiggy.com/dapi/auth/otp-verify", {
      method: "POST",
      headers: getSwiggyHeaders(sessionCookies || undefined),
      body: JSON.stringify({
        mobile,
        otp,
        _device_id: deviceId,
      }),
    });

    const wafAction = response.headers.get("x-amzn-waf-action");
    if (wafAction === "challenge" || (response.status === 202 && response.headers.get("content-length") === "0")) {
      return NextResponse.json(
        { error: "Swiggy's security blocked this request. Please use the token method instead.", code: "WAF_BLOCKED" },
        { status: 403 }
      );
    }

    const data = await response.json();

    if (data.statusCode !== 0) {
      return NextResponse.json(
        { error: data.statusMessage || "Invalid OTP. Please try again." },
        { status: 400 }
      );
    }

    // Build a real Cookie string (name=value pairs only, no Path/Expires
    // attributes), carrying over the cookies from the send-otp step.
    const sessionToken = mergeCookies(
      sessionCookies,
      cookiesFromSetCookie(response.headers.getSetCookie?.() || [])
    );

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Login succeeded but no session token received. Try manual token input." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      token: sessionToken,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
