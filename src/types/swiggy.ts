export interface SwiggyOrderItem {
  name: string;
  quantity: string | number;
  total: string | number;
  subtotal?: string | number;
  final_price?: string | number;
  is_veg?: string | number;
  category_details?: { category?: string };
  image_id?: string;
}

export interface SwiggyOrder {
  order_id: string | number;
  order_time: string;
  order_total: number;
  restaurant_name: string;
  restaurant_cuisine?: string | string[];
  restaurant_id?: string | number;
  order_items?: SwiggyOrderItem[];
  order_delivery_charge?: number;
  discounted_total_delivery_fee?: number;
  delivery_fee?: number;
  coupon_applied?: string;
  coupon_code?: string;
  order_discount?: number;
  coupon_discount?: number;
  trade_discount?: number;
  order_discount_effective?: number;
  discount?: number;
  savings_shown_to_customer?: string | number;
  free_delivery_discount_hit?: number;
  payment_method?: string;
  is_coupon_applied?: boolean;
  order_delivery_status?: string;
  rain_mode?: boolean;
  on_time?: boolean;
  sla_difference?: number;
  delivery_address?: {
    area?: string;
    city?: string;
  };
  restaurant_area_name?: string;
  restaurant_city_name?: string;
}

export interface SwiggyOrdersResponse {
  statusCode: number;
  statusMessage?: string;
  data: {
    orders: SwiggyOrder[];
    total_orders?: number;
    hasMore?: boolean;
  };
}

export interface SwiggyAuthResponse {
  statusCode: number;
  statusMessage?: string;
  data?: Record<string, unknown>;
}

export interface DashboardData {
  summary: SummaryStats;
  monthlySpending: MonthlyData[];
  yearlySpending: YearlyData[];
  weekdayDistribution: WeekdayData[];
  hourlyDistribution: HourlyData[];
  topRestaurants: RestaurantData[];
  cuisineBreakdown: CuisineData[];
  topItems: ItemData[];
  funStats: FunStats;
  orders: SwiggyOrder[];
}

export interface SummaryStats {
  totalSpent: number;
  totalOrders: number;
  avgOrderValue: number;
  totalDeliveryFees: number;
  totalSavings: number;
  mostExpensiveOrder: { amount: number; restaurant: string; date: string };
  cheapestOrder: { amount: number; restaurant: string; date: string };
}

export interface MonthlyData {
  month: string;
  amount: number;
  orders: number;
}

export interface YearlyData {
  year: string;
  amount: number;
  orders: number;
}

export interface WeekdayData {
  day: string;
  orders: number;
  amount: number;
}

export interface HourlyData {
  hour: string;
  orders: number;
  amount: number;
}

export interface RestaurantData {
  name: string;
  cuisine: string;
  orders: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrdered: string;
}

export interface CuisineData {
  name: string;
  orders: number;
  amount: number;
}

export interface ItemData {
  name: string;
  count: number;
  totalSpent: number;
}

export interface FunStats {
  firstOrderDate: string;
  longestStreak: number;
  totalSavings: number;
  favoriteRestaurant: { name: string; count: number };
  favoriteDay: string;
  peakHour: string;
  lateNightOrders: number;
  uniqueRestaurants: number;
  avgOrdersPerMonth: number;
}
