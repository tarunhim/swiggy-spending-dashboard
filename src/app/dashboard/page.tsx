"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, UtensilsCrossed } from "lucide-react";
import { DashboardData, OrdersFetchMeta, SwiggyOrder } from "@/types/swiggy";
import { processOrders } from "@/lib/data-processor";
import LoadingScreen from "@/components/loading-screen";
import SummaryCards from "@/components/summary-cards";
import SpendingChart from "@/components/spending-chart";
import WeekdayChart from "@/components/weekday-chart";
import HourlyChart from "@/components/hourly-chart";
import TopRestaurants from "@/components/top-restaurants";
import CuisineChart from "@/components/cuisine-chart";
import TopItems from "@/components/top-items";
import RestaurantTable from "@/components/restaurant-table";
import OrderTable from "@/components/order-table";
import FunStatsSection from "@/components/fun-stats";

interface StoredDashboardPayload {
  orders: SwiggyOrder[];
  fetchMeta?: OrdersFetchMeta;
  warning?: string;
  fetchedAt?: string;
}

function describeStopReason(reason?: string): string {
  const messages: Record<string, string> = {
    completed: "Fetch completed successfully.",
    no_more_orders: "Swiggy returned no more orders.",
    has_more_false: "Swiggy marked pagination as complete.",
    reached_expected_total: "Fetched the reported total number of orders.",
    max_pages_reached: "Reached the configured pagination page limit.",
    cursor_stalled: "Pagination cursor stopped advancing.",
    reported_total_mismatch: "Fetched fewer orders than Swiggy reported.",
    waf_challenge: "Swiggy security challenge interrupted pagination.",
    auth_expired_mid_fetch: "Session expired while fetching more pages.",
    empty_response_mid_fetch: "Received an empty response while paginating.",
    invalid_json_mid_fetch: "Received invalid JSON while paginating.",
    api_error_mid_fetch: "Swiggy returned an API error while paginating.",
    empty_page_with_has_more: "Swiggy reported more pages but returned an empty page.",
    unknown: "Pagination ended for an unknown reason.",
  };

  return messages[reason || "unknown"] || messages.unknown;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchMeta, setFetchMeta] = useState<OrdersFetchMeta | null>(null);
  const [fetchWarning, setFetchWarning] = useState<string>("");

  useEffect(() => {
    const raw = sessionStorage.getItem("swiggy_orders");
    if (!raw) {
      router.push("/");
      return;
    }

    try {
      const parsed = JSON.parse(raw) as SwiggyOrder[] | StoredDashboardPayload;
      let orders: SwiggyOrder[] = [];
      let meta: OrdersFetchMeta | null = null;
      let warning = "";

      if (Array.isArray(parsed)) {
        orders = parsed;
      } else if (parsed && Array.isArray(parsed.orders)) {
        orders = parsed.orders;
        meta = parsed.fetchMeta || null;
        warning = parsed.warning || "";
      }

      if (!orders || orders.length === 0) {
        router.push("/");
        return;
      }
      const processed = processOrders(orders);
      setData(processed);
      setFetchMeta(meta);
      setFetchWarning(warning);
    } catch {
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading || !data) {
    return <LoadingScreen message="Processing your orders..." />;
  }

  const isPartial =
    Boolean(fetchMeta?.truncated) ||
    Boolean(
      fetchMeta &&
      fetchMeta.expectedTotal !== null &&
      fetchMeta.fetchedCount < fetchMeta.expectedTotal
    );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sessionStorage.removeItem("swiggy_orders");
                router.push("/");
              }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">swigdashVtarun</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {fetchMeta?.expectedTotal !== null
              ? `${fetchMeta.fetchedCount.toLocaleString("en-IN")} / ${fetchMeta.expectedTotal.toLocaleString("en-IN")} orders fetched`
              : `${data.summary.totalOrders.toLocaleString("en-IN")} orders analyzed`}
          </p>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {(isPartial || fetchWarning) && (
          <section className="border border-amber-500/40 bg-amber-500/10 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-200">
                  Showing partial data from Swiggy
                </p>
                {fetchMeta && (
                  <p className="text-xs text-amber-100/90">
                    {fetchMeta.fetchedCount.toLocaleString("en-IN")}
                    {fetchMeta.expectedTotal !== null
                      ? ` of ${fetchMeta.expectedTotal.toLocaleString("en-IN")}`
                      : ""}{" "}
                    orders fetched. {describeStopReason(fetchMeta.stopReason)}
                  </p>
                )}
                {fetchWarning && (
                  <p className="text-xs text-amber-100/90">{fetchWarning}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Summary Cards */}
        <section className="animate-fade-in">
          <SummaryCards stats={data.summary} />
        </section>

        {/* Spending Over Time */}
        <section className="animate-fade-in-delay-1">
          <SpendingChart monthly={data.monthlySpending} yearly={data.yearlySpending} />
        </section>

        {/* Weekday + Hourly Charts */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-delay-2">
          <WeekdayChart data={data.weekdayDistribution} />
          <HourlyChart data={data.hourlyDistribution} />
        </section>

        {/* Top Restaurants + Cuisine */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-delay-3">
          <TopRestaurants restaurants={data.topRestaurants} />
          <CuisineChart data={data.cuisineBreakdown} />
        </section>

        {/* Top Items */}
        <section>
          <TopItems items={data.topItems} />
        </section>

        {/* Restaurant Table */}
        <section>
          <RestaurantTable restaurants={data.topRestaurants} />
        </section>

        {/* Fun Stats */}
        <section>
          <FunStatsSection stats={data.funStats} />
        </section>

        {/* Order History */}
        <section>
          <OrderTable orders={data.orders} />
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground py-8 border-t border-border">
          <p>
            Your data is only in this browser session. Closing the tab clears everything.
          </p>
        </footer>
      </main>
    </div>
  );
}
