import {
  SwiggyOrder,
  DashboardData,
  SummaryStats,
  MonthlyData,
  YearlyData,
  WeekdayData,
  HourlyData,
  RestaurantData,
  CuisineData,
  ItemData,
  FunStats,
} from "@/types/swiggy";
import { parseOrderTime } from "@/lib/utils";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function num(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  const n = typeof val === "string" ? parseFloat(val) : val;
  return isNaN(n) ? 0 : n;
}

function getOrderTotal(o: SwiggyOrder): number {
  return num(o.order_total);
}

export function getDeliveryFee(o: SwiggyOrder): number {
  return num(o.order_delivery_charge) || num(o.discounted_total_delivery_fee) || num(o.delivery_fee) || 0;
}

/**
 * Total discount on an order. Swiggy reports an overall figure (order_discount)
 * and its parts (coupon + restaurant/trade discount); which ones are filled in
 * varies, so take the largest of "overall" and "sum of parts" rather than the
 * first non-zero field. This never double counts.
 */
export function getDiscount(o: SwiggyOrder): number {
  return Math.max(
    num(o.order_discount),
    num(o.order_discount_effective),
    num(o.discount),
    num(o.coupon_discount) + num(o.trade_discount),
    0
  );
}

/** Cancelled / failed orders were not paid for and must not count as spend. */
export function isCancelledOrder(o: SwiggyOrder): boolean {
  const status = `${o.order_status || ""} ${o.order_delivery_status || ""}`.toLowerCase();
  return /cancel|fail|reject/.test(status);
}

function getCuisines(o: SwiggyOrder): string[] {
  const c = o.restaurant_cuisine;
  const list = Array.isArray(c)
    ? c.map((s) => String(s).trim()).filter(Boolean)
    : typeof c === "string"
      ? c.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  return list.length > 0 ? list : ["Other"];
}

/** An order paired with its parsed (wall-clock) time. */
interface Entry {
  o: SwiggyOrder;
  t: Date;
}

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
/** Whole-day number from the local calendar date, immune to timezone/DST shifts. */
const dayNumber = (d: Date) => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

export function processOrders(orders: SwiggyOrder[]): DashboardData {
  const parsed = orders.map((o) => ({ o, t: parseOrderTime(o.order_time) }));

  const cancelledOrders = parsed.filter((e) => isCancelledOrder(e.o)).length;
  const undatedOrders = parsed.filter((e) => !isCancelledOrder(e.o) && !e.t).length;

  // Stats only use orders that were actually placed and have a usable time.
  const entries: Entry[] = parsed
    .filter((e): e is Entry => e.t !== null && !isCancelledOrder(e.o))
    .sort((a, b) => a.t.getTime() - b.t.getTime());

  // The order table still lists everything, newest first (undated at the end).
  const allNewestFirst = [...parsed]
    .sort((a, b) => (b.t ? b.t.getTime() : -Infinity) - (a.t ? a.t.getTime() : -Infinity))
    .map((e) => e.o);

  return {
    summary: computeSummary(entries, cancelledOrders, undatedOrders),
    monthlySpending: computeMonthly(entries),
    yearlySpending: computeYearly(entries),
    weekdayDistribution: computeWeekday(entries),
    hourlyDistribution: computeHourly(entries),
    topRestaurants: computeRestaurants(entries),
    cuisineBreakdown: computeCuisines(entries),
    topItems: computeItems(entries),
    funStats: computeFunStats(entries),
    orders: allNewestFirst,
  };
}

function computeSummary(entries: Entry[], cancelledOrders: number, undatedOrders: number): SummaryStats {
  const orders = entries.map((e) => e.o);
  const totalSpent = orders.reduce((sum, o) => sum + getOrderTotal(o), 0);
  const totalDeliveryFees = orders.reduce((sum, o) => sum + getDeliveryFee(o), 0);
  const totalSavings = orders.reduce((sum, o) => sum + getDiscount(o), 0);

  let mostExpensive: SwiggyOrder | null = null;
  let cheapest: SwiggyOrder | null = null;
  for (const o of orders) {
    const total = getOrderTotal(o);
    if (!mostExpensive || total > getOrderTotal(mostExpensive)) mostExpensive = o;
    if (total > 0 && (!cheapest || total < getOrderTotal(cheapest))) cheapest = o;
  }

  const describe = (o: SwiggyOrder | null) => ({
    amount: o ? getOrderTotal(o) : 0,
    restaurant: o?.restaurant_name || "Unknown",
    date: o?.order_time || "",
  });

  return {
    totalSpent,
    totalOrders: orders.length,
    cancelledOrders,
    undatedOrders,
    avgOrderValue: orders.length ? Math.round(totalSpent / orders.length) : 0,
    totalDeliveryFees,
    totalSavings,
    mostExpensiveOrder: describe(mostExpensive),
    cheapestOrder: describe(cheapest),
  };
}

function computeMonthly(entries: Entry[]): MonthlyData[] {
  if (entries.length === 0) return [];
  const map = new Map<string, { amount: number; orders: number }>();

  // Pre-fill every calendar month in the range so quiet months show as zero.
  const first = entries[0].t;
  const last = entries[entries.length - 1].t;
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
  while (cursor.getFullYear() < last.getFullYear() ||
    (cursor.getFullYear() === last.getFullYear() && cursor.getMonth() <= last.getMonth())) {
    map.set(monthKey(cursor), { amount: 0, orders: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const { o, t } of entries) {
    const bucket = map.get(monthKey(t))!;
    bucket.amount += getOrderTotal(o);
    bucket.orders += 1;
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      amount: Math.round(data.amount),
      orders: data.orders,
    }));
}

function computeYearly(entries: Entry[]): YearlyData[] {
  const map = new Map<string, { amount: number; orders: number }>();

  for (const { o, t } of entries) {
    const year = String(t.getFullYear());
    const existing = map.get(year) || { amount: 0, orders: 0 };
    existing.amount += getOrderTotal(o);
    existing.orders += 1;
    map.set(year, existing);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, data]) => ({
      year,
      amount: Math.round(data.amount),
      orders: data.orders,
    }));
}

function computeWeekday(entries: Entry[]): WeekdayData[] {
  const buckets = WEEKDAYS.map(() => ({ orders: 0, amount: 0 }));
  for (const { o, t } of entries) {
    const bucket = buckets[t.getDay()];
    bucket.orders += 1;
    bucket.amount += getOrderTotal(o);
  }
  return buckets.map((data, dayIdx) => ({
    day: WEEKDAYS[dayIdx],
    orders: data.orders,
    amount: Math.round(data.amount),
  }));
}

function computeHourly(entries: Entry[]): HourlyData[] {
  const buckets = Array.from({ length: 24 }, () => ({ orders: 0, amount: 0 }));
  for (const { o, t } of entries) {
    const bucket = buckets[t.getHours()];
    bucket.orders += 1;
    bucket.amount += getOrderTotal(o);
  }
  return buckets.map((data, hour) => ({
    hour: `${hour.toString().padStart(2, "0")}:00`,
    orders: data.orders,
    amount: Math.round(data.amount),
  }));
}

function computeRestaurants(entries: Entry[]): RestaurantData[] {
  const map = new Map<
    string,
    { cuisine: string; orders: number; totalSpent: number; lastOrdered: string }
  >();

  // Entries are oldest-first, so the last one seen is the most recent order.
  for (const { o } of entries) {
    const name = o.restaurant_name || "Unknown";
    const existing = map.get(name) || { cuisine: "", orders: 0, totalSpent: 0, lastOrdered: "" };
    existing.orders += 1;
    existing.totalSpent += getOrderTotal(o);
    existing.lastOrdered = o.order_time;
    existing.cuisine = getCuisines(o).join(", ");
    map.set(name, existing);
  }

  return Array.from(map.entries())
    .map(([name, data]) => ({
      name,
      cuisine: data.cuisine,
      orders: data.orders,
      totalSpent: Math.round(data.totalSpent),
      avgOrderValue: Math.round(data.totalSpent / data.orders),
      lastOrdered: data.lastOrdered,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);
}

function computeCuisines(entries: Entry[]): CuisineData[] {
  const map = new Map<string, { orders: number; share: number; amount: number }>();

  for (const { o } of entries) {
    const cuisines = Array.from(new Set(getCuisines(o)));
    for (const cuisine of cuisines) {
      const existing = map.get(cuisine) || { orders: 0, share: 0, amount: 0 };
      existing.orders += 1;
      existing.share += 1 / cuisines.length;
      existing.amount += getOrderTotal(o) / cuisines.length;
      map.set(cuisine, existing);
    }
  }

  return Array.from(map.entries())
    .map(([name, data]) => ({
      name,
      orders: data.orders,
      share: data.share,
      amount: Math.round(data.amount),
    }))
    .sort((a, b) => b.share - a.share);
}

function computeItems(entries: Entry[]): ItemData[] {
  const map = new Map<string, { name: string; restaurant: string; count: number; totalSpent: number }>();

  for (const { o } of entries) {
    if (!o.order_items) continue;
    const restaurant = o.restaurant_name || "Unknown";
    for (const item of o.order_items) {
      const name = item.name || "Unknown Item";
      // Same dish name at different restaurants is a different item.
      const key = `${restaurant}\u0000${name}`;
      const existing = map.get(key) || { name, restaurant, count: 0, totalSpent: 0 };
      existing.count += num(item.quantity) || 1;
      existing.totalSpent += num(item.total) || num(item.final_price) || num(item.subtotal);
      map.set(key, existing);
    }
  }

  return Array.from(map.entries())
    .map(([key, data]) => ({
      key,
      name: data.name,
      restaurant: data.restaurant,
      count: data.count,
      totalSpent: Math.round(data.totalSpent),
    }))
    .sort((a, b) => b.count - a.count);
}

function computeFunStats(entries: Entry[]): FunStats {
  if (entries.length === 0) {
    return {
      firstOrderDate: "",
      longestStreak: 0,
      totalSavings: 0,
      favoriteRestaurant: { name: "N/A", count: 0 },
      favoriteDay: "N/A",
      peakHour: "N/A",
      lateNightOrders: 0,
      uniqueRestaurants: 0,
      avgOrdersPerMonth: 0,
    };
  }

  const first = entries[0];
  const last = entries[entries.length - 1];

  // Streak of consecutive calendar days, using the same local dates as the charts.
  const days = Array.from(new Set(entries.map((e) => dayNumber(e.t)))).sort((a, b) => a - b);
  let longestStreak = 1;
  let currentStreak = 1;
  for (let i = 1; i < days.length; i++) {
    currentStreak = days[i] - days[i - 1] === 1 ? currentStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, currentStreak);
  }

  const totalSavings = entries.reduce((sum, e) => sum + getDiscount(e.o), 0);

  const restMap = new Map<string, number>();
  for (const { o } of entries) {
    const name = o.restaurant_name || "Unknown";
    restMap.set(name, (restMap.get(name) || 0) + 1);
  }
  let favoriteRestaurant = { name: "N/A", count: 0 };
  for (const [name, count] of restMap) {
    if (count > favoriteRestaurant.count) favoriteRestaurant = { name, count };
  }

  const dayCounts = new Array(7).fill(0);
  const hourCounts = new Array(24).fill(0);
  for (const { t } of entries) {
    dayCounts[t.getDay()] += 1;
    hourCounts[t.getHours()] += 1;
  }
  const maxDay = dayCounts.indexOf(Math.max(...dayCounts));
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  const lateNightOrders = entries.filter(({ t }) => t.getHours() >= 22 || t.getHours() < 4).length;

  // Calendar months from first to last order, inclusive (quiet months count).
  const monthsSpan =
    (last.t.getFullYear() - first.t.getFullYear()) * 12 + (last.t.getMonth() - first.t.getMonth()) + 1;

  return {
    firstOrderDate: first.o.order_time,
    longestStreak,
    totalSavings,
    favoriteRestaurant,
    favoriteDay: WEEKDAYS[maxDay],
    peakHour: `${peakHour.toString().padStart(2, "0")}:00`,
    lateNightOrders,
    uniqueRestaurants: restMap.size,
    avgOrdersPerMonth: Math.round((entries.length / monthsSpan) * 10) / 10,
  };
}
