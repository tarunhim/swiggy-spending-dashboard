import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getSwiggyHeaders } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { mobile } = await request.json();

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian mobile number" },
        { status: 400 }
      );
    }

    const deviceId = uuidv4();

    const response = await fetch("https://www.swiggy.com/dapi/auth/sms-otp", {
      method: "POST",
      headers: {
        ...getSwiggyHeaders(),
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "sec-ch-ua": '"Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
      },
      body: JSON.stringify({
        mobile,
        _device_id: deviceId,
      }),
    });

    // Swiggy WAF returns 202 with x-amzn-waf-action: challenge for bot detection
    const wafAction = response.headers.get("x-amzn-waf-action");
    if (wafAction === "challenge" || (response.status === 202 && response.headers.get("content-length") === "0")) {
      return NextResponse.json(
        {
          error: "Swiggy's security blocked this request. Please use the token method instead — it's quick and easy!",
          code: "WAF_BLOCKED",
        },
        { status: 403 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Swiggy returned status ${response.status}. Please try the token method.`, code: "API_ERROR" },
        { status: 400 }
      );
    }

    const data = await response.json();

    if (data.statusCode !== 0) {
      return NextResponse.json(
        { error: data.statusMessage || "Failed to send OTP. Please try again." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      deviceId,
      message: "OTP sent successfully",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Something went wrong: ${message}. Please try the token method.` },
      { status: 500 }
    );
  }
}
