import { NextRequest, NextResponse } from "next/server";
import { getSwiggyHeaders } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { mobile, otp, deviceId } = await request.json();

    if (!mobile || !otp || !deviceId) {
      return NextResponse.json(
        { error: "Mobile, OTP, and device ID are required" },
        { status: 400 }
      );
    }

    const response = await fetch("https://www.swiggy.com/dapi/auth/otp-verify", {
      method: "POST",
      headers: getSwiggyHeaders(),
      body: JSON.stringify({
        mobile,
        otp,
        _device_id: deviceId,
      }),
    });

    const data = await response.json();

    if (data.statusCode !== 0) {
      return NextResponse.json(
        { error: data.statusMessage || "Invalid OTP. Please try again." },
        { status: 400 }
      );
    }

    const cookies = response.headers.getSetCookie?.() || [];
    const allCookies = cookies.join("; ");

    let sessionToken = allCookies;
    if (!sessionToken) {
      const rawHeader = response.headers.get("set-cookie") || "";
      sessionToken = rawHeader;
    }

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
