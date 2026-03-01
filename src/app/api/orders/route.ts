import { NextRequest, NextResponse } from "next/server";
import { getSwiggyHeaders } from "@/lib/utils";
import {
  OrdersFetchMeta,
  OrdersFetchStopReason,
  SwiggyOrder,
  SwiggyOrdersResponse,
} from "@/types/swiggy";

function formatCookie(token: string): string {
  const trimmed = token.trim();
  if (trimmed.includes("=")) {
    return trimmed;
  }
  return `_session_tid=${trimmed}`;
}

function parseMaxPages(): number {
  const fromEnv = Number(process.env.SWIGGY_MAX_PAGES);
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return Math.floor(fromEnv);
  }
  return 300;
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Session token is required" }, { status: 400 });
    }

    const cookie = formatCookie(token);
    const allOrders: SwiggyOrder[] = [];
    const seenOrderIds = new Set<string>();
    let lastOrderId = "";
    let pagesFetched = 0;
    let expectedTotal: number | null = null;
    const maxPages = parseMaxPages();
    let truncated = false;
    let stopReason: OrdersFetchStopReason = "unknown";
    let warning: string | undefined;

    const buildSuccessResponse = () => {
      const fetchMeta: OrdersFetchMeta = {
        expectedTotal,
        fetchedCount: allOrders.length,
        pagesFetched,
        truncated,
        stopReason,
        maxPages,
      };

      return NextResponse.json({
        success: true,
        orders: allOrders,
        totalOrders: allOrders.length,
        fetchMeta,
        warning,
      });
    };

    while (pagesFetched < maxPages) {
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
        if (allOrders.length > 0) {
          truncated = true;
          stopReason = "waf_challenge";
          warning = "Swiggy blocked pagination mid-way. Showing the data fetched so far.";
          break;
        }
        return NextResponse.json(
          { error: "Swiggy's security blocked the request. Please try copying the full cookie string from your browser." },
          { status: 403 }
        );
      }

      if (response.status === 401 || response.status === 403) {
        if (allOrders.length > 0) {
          truncated = true;
          stopReason = "auth_expired_mid_fetch";
          warning = "Your session expired during pagination. Showing the data fetched so far.";
          break;
        }
        return NextResponse.json(
          { error: "Session expired or invalid token. Please get a fresh token from Swiggy." },
          { status: 401 }
        );
      }

      const text = await response.text();
      if (!text || text.trim().length === 0) {
        if (allOrders.length > 0) {
          truncated = true;
          stopReason = "empty_response_mid_fetch";
          warning = "Received an empty response mid-way. Showing the data fetched so far.";
          break;
        }
        return NextResponse.json(
          { error: "Swiggy returned an empty response. Your token may be invalid or expired." },
          { status: 400 }
        );
      }

      let data: SwiggyOrdersResponse;
      try {
        data = JSON.parse(text) as SwiggyOrdersResponse;
      } catch {
        if (allOrders.length > 0) {
          truncated = true;
          stopReason = "invalid_json_mid_fetch";
          warning = "Swiggy returned invalid JSON during pagination. Showing the data fetched so far.";
          break;
        }
        return NextResponse.json(
          { error: `Swiggy returned unexpected response (HTTP ${response.status}). Token may be invalid.` },
          { status: 400 }
        );
      }

      if (data.statusCode !== 0 || !Array.isArray(data.data?.orders)) {
        if (allOrders.length > 0) {
          truncated = true;
          stopReason = "api_error_mid_fetch";
          warning = "Swiggy returned an API error during pagination. Showing the data fetched so far.";
          break;
        }
        const msg = data.statusMessage || "Failed to fetch orders";
        return NextResponse.json(
          { error: `Swiggy API error: ${msg}. Please check your token.` },
          { status: 400 }
        );
      }

      if (typeof data.data.total_orders === "number" && data.data.total_orders >= 0) {
        expectedTotal = data.data.total_orders;
      }

      const orders: SwiggyOrder[] = data.data.orders;
      const hasMore = data.data.hasMore;
      if (orders.length === 0) {
        if (hasMore) {
          truncated = true;
          stopReason = "empty_page_with_has_more";
          warning = "Swiggy indicated more pages but returned an empty page.";
        } else {
          stopReason = "no_more_orders";
        }
        break;
      }

      let newlyAdded = 0;
      for (const order of orders) {
        const id = String(order.order_id ?? "");
        if (id && seenOrderIds.has(id)) {
          continue;
        }
        if (id) {
          seenOrderIds.add(id);
        }
        allOrders.push(order);
        newlyAdded++;
      }

      pagesFetched++;

      const nextOrderId = orders[orders.length - 1]?.order_id;
      const nextCursor = nextOrderId === undefined || nextOrderId === null ? "" : String(nextOrderId);
      if (!nextCursor || nextCursor === lastOrderId || newlyAdded === 0) {
        truncated = true;
        stopReason = "cursor_stalled";
        warning = "Pagination cursor stalled before the full history could be fetched.";
        break;
      }
      lastOrderId = nextCursor;

      if (expectedTotal !== null && allOrders.length >= expectedTotal) {
        stopReason = "reached_expected_total";
        break;
      }

      if (hasMore === false) {
        stopReason = "has_more_false";
        break;
      }
    }

    if (pagesFetched >= maxPages && stopReason === "unknown") {
      truncated = true;
      stopReason = "max_pages_reached";
      warning = `Reached the maximum pagination limit (${maxPages} pages).`;
    }

    if (expectedTotal !== null && allOrders.length < expectedTotal) {
      truncated = true;
      if (stopReason === "has_more_false" || stopReason === "unknown") {
        stopReason = "reported_total_mismatch";
      }
      warning = warning || "Swiggy reported more orders than were fetched.";
    }

    if (stopReason === "unknown") {
      stopReason = "completed";
    }

    if (allOrders.length === 0) {
      return NextResponse.json(
        { error: "No orders found. Please make sure you're using a valid Swiggy session token." },
        { status: 400 }
      );
    }

    return buildSuccessResponse();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch orders: ${message}` },
      { status: 500 }
    );
  }
}
