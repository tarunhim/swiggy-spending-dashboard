import { NextRequest, NextResponse } from "next/server";
import { getSwiggyHeaders } from "@/lib/utils";
import { SwiggyOrder } from "@/types/swiggy";

function formatCookie(token: string): string {
  const trimmed = token.trim();
  if (trimmed.includes("=")) {
    return trimmed;
  }
  return `_session_tid=${trimmed}`;
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Session token is required" }, { status: 400 });
    }

    const cookie = formatCookie(token);
    const allOrders: SwiggyOrder[] = [];
    let lastOrderId = "";
    let page = 0;
    let totalOrders = Infinity;
    const MAX_PAGES = 300;

    while (allOrders.length < totalOrders && page < MAX_PAGES) {
      const url = `https://www.swiggy.com/dapi/order/all?order_id=${lastOrderId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...getSwiggyHeaders(cookie),
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      const wafAction = response.headers.get("x-amzn-waf-action");
      if (wafAction === "challenge" || (response.status === 202 && response.headers.get("content-length") === "0")) {
        if (allOrders.length > 0) break;
        return NextResponse.json(
          { error: "Swiggy's security blocked the request. Please try copying the full cookie string from your browser." },
          { status: 403 }
        );
      }

      if (response.status === 401 || response.status === 403) {
        if (allOrders.length > 0) break;
        return NextResponse.json(
          { error: "Session expired or invalid token. Please get a fresh token from Swiggy." },
          { status: 401 }
        );
      }

      const text = await response.text();
      if (!text || text.trim().length === 0) {
        if (allOrders.length > 0) break;
        return NextResponse.json(
          { error: "Swiggy returned an empty response. Your token may be invalid or expired." },
          { status: 400 }
        );
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        if (allOrders.length > 0) break;
        return NextResponse.json(
          { error: `Swiggy returned unexpected response (HTTP ${response.status}). Token may be invalid.` },
          { status: 400 }
        );
      }

      if (data.statusCode !== 0 || !data.data?.orders) {
        if (allOrders.length > 0) break;
        const msg = data.statusMessage || "Failed to fetch orders";
        return NextResponse.json(
          { error: `Swiggy API error: ${msg}. Please check your token.` },
          { status: 400 }
        );
      }

      if (data.data.total_orders) {
        totalOrders = data.data.total_orders;
      }

      const orders: SwiggyOrder[] = data.data.orders;
      if (orders.length === 0) break;

      allOrders.push(...orders);
      lastOrderId = String(orders[orders.length - 1].order_id);
      page++;
    }

    if (allOrders.length === 0) {
      return NextResponse.json(
        { error: "No orders found. Please make sure you're using a valid Swiggy session token." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      orders: allOrders,
      totalOrders: allOrders.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch orders: ${message}` },
      { status: 500 }
    );
  }
}
