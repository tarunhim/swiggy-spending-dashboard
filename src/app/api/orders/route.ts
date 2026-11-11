import { NextRequest, NextResponse } from "next/server";
import { getSwiggyHeaders } from "@/lib/utils";
import {
  OrdersChunkResponse,
  OrdersFetchStopReason,
  SwiggyOrder,
  SwiggyOrderItem,
  SwiggyOrdersResponse,
} from "@/types/swiggy";

// Each call fetches a bounded chunk of pages; the browser keeps calling with
// the returned cursor. This keeps every invocation well inside the serverless
// time limit and the response-size limit, however long the order history is.
export const maxDuration = 60;

const PAGES_PER_CALL = 15;
const TIME_BUDGET_MS = 35_000;
const PAGE_DELAY_MS = 150;
const RETRY_DELAY_MS = 1500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function formatCookie(token: string): string {
  const trimmed = token.trim();
  if (trimmed.includes("=")) {
    return trimmed;
  }
  return `_session_tid=${trimmed}`;
}

function pick<T extends object>(source: T, keys: (keyof T)[]): T {
  const out = {} as T;
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) out[key] = source[key];
  }
  return out;
}

const ITEM_FIELDS: (keyof SwiggyOrderItem)[] = [
  "name", "quantity", "total", "subtotal", "final_price", "is_veg",
];

const ORDER_FIELDS: (keyof SwiggyOrder)[] = [
  "order_id", "order_time", "order_total", "restaurant_name", "restaurant_cuisine",
  "restaurant_id", "order_delivery_charge", "discounted_total_delivery_fee", "delivery_fee",
  "coupon_applied", "coupon_code", "order_discount", "coupon_discount", "trade_discount",
  "order_discount_effective", "discount", "payment_method", "order_delivery_status",
  "order_status", "restaurant_area_name", "restaurant_city_name",
];

/** Keep only the fields the dashboard reads; raw Swiggy orders are many KB each. */
function trimOrder(order: SwiggyOrder): SwiggyOrder {
  const trimmed = pick(order, ORDER_FIELDS);
  if (Array.isArray(order.order_items)) {
    trimmed.order_items = order.order_items.map((item) => pick(item, ITEM_FIELDS));
  }
  return trimmed;
}

type PageResult =
  | { ok: true; data: SwiggyOrdersResponse["data"] }
  | { ok: false; reason: OrdersFetchStopReason; retryable: boolean; status: number; message: string };

async function fetchPage(cookie: string, cursor: string): Promise<PageResult> {
  const response = await fetch(`https://www.swiggy.com/dapi/order/all?order_id=${encodeURIComponent(cursor)}`, {
    method: "GET",
    headers: {
      ...getSwiggyHeaders(cookie),
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
    },
    cache: "no-store",
  });

  const wafAction = response.headers.get("x-amzn-waf-action");
  if (wafAction === "challenge" || (response.status === 202 && response.headers.get("content-length") === "0")) {
    return {
      ok: false, reason: "waf_challenge", retryable: true, status: 403,
      message: "Swiggy's security blocked the request. Please try copying the full cookie string from your browser.",
    };
  }

  if (response.status === 401 || response.status === 403) {
    return {
      ok: false, reason: "auth_expired_mid_fetch", retryable: false, status: 401,
      message: "Session expired or invalid token. Please get a fresh token from Swiggy.",
    };
  }

  const text = await response.text();
  if (!text || text.trim().length === 0) {
    return {
      ok: false, reason: "empty_response_mid_fetch", retryable: true, status: 400,
      message: "Swiggy returned an empty response. Your token may be invalid or expired.",
    };
  }

  let data: SwiggyOrdersResponse;
  try {
    data = JSON.parse(text) as SwiggyOrdersResponse;
  } catch {
    return {
      ok: false, reason: "invalid_json_mid_fetch", retryable: true, status: 400,
      message: `Swiggy returned unexpected response (HTTP ${response.status}). Token may be invalid.`,
    };
  }

  if (data.statusCode !== 0 || !Array.isArray(data.data?.orders)) {
    const msg = data.statusMessage || "Failed to fetch orders";
    return {
      ok: false, reason: "api_error_mid_fetch", retryable: false, status: 400,
      message: `Swiggy API error: ${msg}. Please check your token.`,
    };
  }

  return { ok: true, data: data.data };
}

const MID_FETCH_WARNINGS: Partial<Record<OrdersFetchStopReason, string>> = {
  waf_challenge: "Swiggy blocked pagination mid-way. Showing the data fetched so far.",
  auth_expired_mid_fetch: "Your session expired during pagination. Showing the data fetched so far.",
  empty_response_mid_fetch: "Received an empty response mid-way. Showing the data fetched so far.",
  invalid_json_mid_fetch: "Swiggy returned invalid JSON during pagination. Showing the data fetched so far.",
  api_error_mid_fetch: "Swiggy returned an API error during pagination. Showing the data fetched so far.",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token: unknown = body?.token;
    const startCursor = typeof body?.cursor === "string" ? body.cursor : "";

    if (typeof token !== "string" || !token.trim()) {
      return NextResponse.json({ error: "Session token is required" }, { status: 400 });
    }

    const cookie = formatCookie(token);
    const startedAt = Date.now();
    const chunk: SwiggyOrder[] = [];
    const seenOrderIds = new Set<string>();
    let cursor = startCursor;
    let nextCursor: string | null = null;
    let pagesFetched = 0;
    let expectedTotal: number | null = null;
    let truncated = false;
    let stopReason: OrdersFetchStopReason = "unknown";
    let warning: string | undefined;

    while (true) {
      if (pagesFetched > 0) await sleep(PAGE_DELAY_MS);

      let page = await fetchPage(cookie, cursor);
      if (!page.ok && page.retryable) {
        await sleep(RETRY_DELAY_MS);
        page = await fetchPage(cookie, cursor);
      }

      if (!page.ok) {
        // Nothing fetched at all (first page of the very first call): hard error.
        if (!startCursor && chunk.length === 0) {
          return NextResponse.json({ error: page.message }, { status: page.status });
        }
        truncated = true;
        stopReason = page.reason;
        warning = MID_FETCH_WARNINGS[page.reason];
        break;
      }

      if (typeof page.data.total_orders === "number" && page.data.total_orders >= 0) {
        expectedTotal = page.data.total_orders;
      }

      const orders = page.data.orders;
      const hasMore = page.data.hasMore;
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
        if (id && seenOrderIds.has(id)) continue;
        if (id) seenOrderIds.add(id);
        chunk.push(trimOrder(order));
        newlyAdded++;
      }
      pagesFetched++;

      const lastId = orders[orders.length - 1]?.order_id;
      const candidate = lastId === undefined || lastId === null ? "" : String(lastId);
      if (!candidate || candidate === cursor || newlyAdded === 0) {
        truncated = true;
        stopReason = "cursor_stalled";
        warning = "Pagination cursor stalled before the full history could be fetched.";
        break;
      }
      cursor = candidate;

      if (hasMore === false) {
        stopReason = "has_more_false";
        break;
      }

      // More to fetch, but this call has done its share: hand the cursor back.
      if (pagesFetched >= PAGES_PER_CALL || Date.now() - startedAt > TIME_BUDGET_MS) {
        nextCursor = cursor;
        break;
      }
    }

    if (!startCursor && chunk.length === 0) {
      return NextResponse.json(
        { error: "No orders found. Please make sure you're using a valid Swiggy session token." },
        { status: 400 }
      );
    }

    const payload: OrdersChunkResponse = {
      success: true,
      orders: chunk,
      nextCursor,
      expectedTotal,
      pagesFetched,
      truncated,
      stopReason: nextCursor ? "unknown" : stopReason,
      warning,
    };
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch orders: ${message}` },
      { status: 500 }
    );
  }
}
