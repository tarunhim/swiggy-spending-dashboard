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

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function num(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  const n = typeof val === "string" ? parseFloat(val) : val;
  return isNaN(n) ? 0 : n;
}

function getOrderTotal(o: SwiggyOrder): number {
  return num(o.order_total);
}

function getDeliveryFee(o: SwiggyOrder): number {
  return num(o.order_delivery_charge) || num(o.discounted_total_delivery_fee) || num(o.delivery_fee) || 0;
}

function getDiscount(o: SwiggyOrder): number {
  return num(o.order_discount) || num(o.order_discount_effective) || num(o.coupon_discount) || num(o.discount) || 0;
}

function getCuisines(o: SwiggyOrder): string[] {
  const c = o.restaurant_cuisine;
  if (!c) return ["Other"];
  if (Array.isArray(c)) return c.length > 0 ? c : ["Other"];
  return c.split(",").map((s) => s.trim()).filter(Boolean);
}

export function processOrders(orders: SwiggyOrder[]): DashboardData {
  const sorted = [...orders].sort(
    (a, b) => new Date(a.order_time).getTime() - new Date(b.order_time).getTime()
  );

  return {
    summary: computeSummary(sorted),
    monthlySpending: computeMonthly(sorted),
    yearlySpending: computeYearly(sorted),
    weekdayDistribution: computeWeekday(sorted),
    hourlyDistribution: computeHourly(sorted),
    topRestaurants: computeRestaurants(sorted),
    cuisineBreakdown: computeCuisines(sorted),
    topItems: computeItems(sorted),
    funStats: computeFunStats(sorted),
    orders: sorted.reverse(),
  };
}

function computeSummary(orders: SwiggyOrder[]): SummaryStats {
  const totalSpent = orders.reduce((sum, o) => sum + getOrderTotal(o), 0);
  const totalDeliveryFees = orders.reduce((sum, o) => sum + getDeliveryFee(o), 0);
  const totalSavings = orders.reduce((sum, o) => sum + getDiscount(o), 0);

  let mostExpensive = orders[0] || { order_total: 0, restaurant_name: "", order_time: "" };
  let cheapest = orders[0] || { order_total: 0, restaurant_name: "", order_time: "" };

  for (const o of orders) {
    if (getOrderTotal(o) > getOrderTotal(mostExpensive)) mostExpensive = o;
    if (getOrderTotal(o) < getOrderTotal(cheapest) && getOrderTotal(o) > 0) cheapest = o;
  }

  return {
    totalSpent,
    totalOrders: orders.length,
    avgOrderValue: orders.length ? Math.round(totalSpent / orders.length) : 0,
    totalDeliveryFees,
    totalSavings,
    mostExpensiveOrder: {
      amount: getOrderTotal(mostExpensive),
      restaurant: mostExpensive.restaurant_name || "Unknown",
      date: mostExpensive.order_time || "",
    },
    cheapestOrder: {
      amount: getOrderTotal(cheapest),
      restaurant: cheapest.restaurant_name || "Unknown",
      date: cheapest.order_time || "",
    },
  };
}

function computeMonthly(orders: SwiggyOrder[]): MonthlyData[] {
  const map = new Map<string, { amount: number; orders: number }>();

  for (const o of orders) {
    const d = new Date(o.order_time);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const existing = map.get(key) || { amount: 0, orders: 0 };
    existing.amount += getOrderTotal(o);
    existing.orders += 1;
    map.set(key, existing);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      amount: Math.round(data.amount),
      orders: data.orders,
    }));
}

function computeYearly(orders: SwiggyOrder[]): YearlyData[] {
  const map = new Map<string, { amount: number; orders: number }>();

  for (const o of orders) {
    const year = String(new Date(o.order_time).getFullYear());
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

function computeWeekday(orders: SwiggyOrder[]): WeekdayData[] {
  const map = new Map<number, { orders: number; amount: number }>();
  for (let i = 0; i < 7; i++) map.set(i, { orders: 0, amount: 0 });

  for (const o of orders) {
    const day = new Date(o.order_time).getDay();
    const existing = map.get(day)!;
    existing.orders += 1;
    existing.amount += getOrderTotal(o);
  }

  return Array.from(map.entries()).map(([dayIdx, data]) => ({
    day: WEEKDAYS[dayIdx],
    orders: data.orders,
    amount: Math.round(data.amount),
  }));
}

function computeHourly(orders: SwiggyOrder[]): HourlyData[] {
  const map = new Map<number, { orders: number; amount: number }>();
  for (let i = 0; i < 24; i++) map.set(i, { orders: 0, amount: 0 });

  for (const o of orders) {
    const hour = new Date(o.order_time).getHours();
    const existing = map.get(hour)!;
    existing.orders += 1;
    existing.amount += getOrderTotal(o);
  }

  return Array.from(map.entries()).map(([hour, data]) => ({
    hour: `${hour.toString().padStart(2, "0")}:00`,
    orders: data.orders,
    amount: Math.round(data.amount),
  }));
}

function computeRestaurants(orders: SwiggyOrder[]): RestaurantData[] {
  const map = new Map<
    string,
    { cuisine: string; orders: number; totalSpent: number; lastOrdered: string }
  >();

  for (const o of orders) {
    const name = o.restaurant_name || "Unknown";
    const cuisines = getCuisines(o);
    const existing = map.get(name) || {
      cuisine: cuisines.join(", "),
      orders: 0,
      totalSpent: 0,
      lastOrdered: o.order_time,
    };
    existing.orders += 1;
    existing.totalSpent += getOrderTotal(o);
    if (new Date(o.order_time) > new Date(existing.lastOrdered)) {
      existing.lastOrdered = o.order_time;
    }
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

function computeCuisines(orders: SwiggyOrder[]): CuisineData[] {
  const map = new Map<string, { orders: number; amount: number }>();

  for (const o of orders) {
    const cuisines = getCuisines(o);
    for (const cuisine of cuisines) {
      const existing = map.get(cuisine) || { orders: 0, amount: 0 };
      existing.orders += 1;
      existing.amount += getOrderTotal(o) / cuisines.length;
      map.set(cuisine, existing);
    }
  }

  return Array.from(map.entries())
    .map(([name, data]) => ({
      name,
      orders: data.orders,
      amount: Math.round(data.amount),
    }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 15);
}

function computeItems(orders: SwiggyOrder[]): ItemData[] {
  const map = new Map<string, { count: number; totalSpent: number }>();

  for (const o of orders) {
    if (!o.order_items) continue;
    for (const item of o.order_items) {
      const name = item.name || "Unknown Item";
      const qty = num(item.quantity) || 1;
      const total = num(item.total);
      const existing = map.get(name) || { count: 0, totalSpent: 0 };
      existing.count += qty;
      existing.totalSpent += total;
      map.set(name, existing);
    }
  }

  return Array.from(map.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      totalSpent: Math.round(data.totalSpent),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

function computeFunStats(orders: SwiggyOrder[]): FunStats {
  if (orders.length === 0) {
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

  const firstOrderDate = orders[0].order_time;

  const orderDates = new Set(
    orders.map((o) => new Date(o.order_time).toISOString().split("T")[0])
  );
  const sortedDates = Array.from(orderDates).sort();
  let longestStreak = 1;
  let currentStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  const totalSavings = orders.reduce((sum, o) => sum + getDiscount(o), 0);

  const restMap = new Map<string, number>();
  for (const o of orders) {
    const name = o.restaurant_name || "Unknown";
    restMap.set(name, (restMap.get(name) || 0) + 1);
  }
  let favoriteRestaurant = { name: "N/A", count: 0 };
  for (const [name, count] of restMap) {
    if (count > favoriteRestaurant.count) favoriteRestaurant = { name, count };
  }

  const dayMap = new Map<number, number>();
  for (const o of orders) {
    const day = new Date(o.order_time).getDay();
    dayMap.set(day, (dayMap.get(day) || 0) + 1);
  }
  let maxDay = 0;
  let maxDayCount = 0;
  for (const [day, count] of dayMap) {
    if (count > maxDayCount) {
      maxDay = day;
      maxDayCount = count;
    }
  }

  const hourMap = new Map<number, number>();
  for (const o of orders) {
    const hour = new Date(o.order_time).getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  }
  let peakHour = 0;
  let peakCount = 0;
  for (const [hour, count] of hourMap) {
    if (count > peakCount) {
      peakHour = hour;
      peakCount = count;
    }
  }

  const lateNightOrders = orders.filter((o) => {
    const h = new Date(o.order_time).getHours();
    return h >= 22 || h < 4;
  }).length;

  const uniqueRestaurants = new Set(orders.map((o) => o.restaurant_name)).size;

  const months = new Set(
    orders.map((o) => {
      const d = new Date(o.order_time);
      return `${d.getFullYear()}-${d.getMonth()}`;
    })
  ).size;

  return {
    firstOrderDate,
    longestStreak,
    totalSavings,
    favoriteRestaurant,
    favoriteDay: WEEKDAYS[maxDay],
    peakHour: `${peakHour.toString().padStart(2, "0")}:00`,
    lateNightOrders,
    uniqueRestaurants,
    avgOrdersPerMonth: months > 0 ? Math.round(orders.length / months) : orders.length,
  };
}
