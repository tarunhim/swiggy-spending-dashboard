"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";
import { DashboardData, SwiggyOrder } from "@/types/swiggy";
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

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem("swiggy_orders");
    if (!raw) {
      router.push("/");
      return;
    }

    try {
      const orders: SwiggyOrder[] = JSON.parse(raw);
      if (!orders || orders.length === 0) {
        router.push("/");
        return;
      }
      const processed = processOrders(orders);
      setData(processed);
    } catch {
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading || !data) {
    return <LoadingScreen message="Processing your orders..." />;
  }

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
              <span className="font-semibold text-foreground">Swiggy Dashboard</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {data.summary.totalOrders} orders analyzed
          </p>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
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
