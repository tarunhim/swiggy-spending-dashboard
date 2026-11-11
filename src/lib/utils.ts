export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Swiggy sends order_time as "YYYY-MM-DD HH:MM:SS" (IST wall-clock, no zone).
 * Parse it by hand so the wall-clock values survive in any browser/timezone
 * (Safari rejects the space-separated form, and Date() would shift it abroad).
 * Returns null when the value cannot be understood.
 */
export function parseOrderTime(value: unknown): Date | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number" || (typeof value === "string" && /^\d{10,13}$/.test(value.trim()))) {
    const n = Number(value);
    const d = new Date(n < 1e12 ? n * 1000 : n);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value !== "string") return null;
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    const d = new Date(
      Number(m[1]), Number(m[2]) - 1, Number(m[3]),
      Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0)
    );
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(dateStr: string): string {
  const date = parseOrderTime(dateStr);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatMonth(dateStr: string): string {
  const date = parseOrderTime(dateStr);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

const SWIGGY_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Origin: "https://www.swiggy.com",
  Referer: "https://www.swiggy.com/",
};

export function getSwiggyHeaders(cookie?: string): Record<string, string> {
  const headers: Record<string, string> = { ...SWIGGY_HEADERS };
  if (cookie) {
    headers["Cookie"] = cookie;
  }
  return headers;
}

/** Reduce Set-Cookie header values to a "name=value; name=value" Cookie string. */
export function cookiesFromSetCookie(setCookies: string[]): string {
  return setCookies
    .map((c) => c.split(";")[0].trim())
    .filter((c) => c.includes("="))
    .join("; ");
}

/** Merge Cookie strings; later values win for the same cookie name. */
export function mergeCookies(...cookieStrings: (string | undefined)[]): string {
  const jar = new Map<string, string>();
  for (const str of cookieStrings) {
    if (!str) continue;
    for (const part of str.split(";")) {
      const idx = part.indexOf("=");
      if (idx <= 0) continue;
      jar.set(part.slice(0, idx).trim(), part.slice(idx + 1).trim());
    }
  }
  return Array.from(jar.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
}
