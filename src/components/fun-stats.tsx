"use client";

import {
  Calendar,
  Flame,
  Percent,
  Heart,
  CalendarDays,
  Clock,
  Moon,
  Store,
  TrendingUp,
} from "lucide-react";
import { FunStats as FunStatsType } from "@/types/swiggy";
import { formatCurrency, formatDate } from "@/lib/utils";

interface FunStatsProps {
  stats: FunStatsType;
}

export default function FunStatsSection({ stats }: FunStatsProps) {
  const insights = [
    {
      icon: Calendar,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      text: `You've been ordering since ${stats.firstOrderDate ? formatDate(stats.firstOrderDate) : "N/A"}`,
    },
    {
      icon: Flame,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      text: `Your longest ordering streak was ${stats.longestStreak} days in a row`,
    },
    {
      icon: Percent,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      text: `You saved ${formatCurrency(stats.totalSavings)} using coupons & discounts`,
    },
    {
      icon: Heart,
      color: "text-red-500",
      bg: "bg-red-500/10",
      text: `Your go-to restaurant is ${stats.favoriteRestaurant.name} — ordered ${stats.favoriteRestaurant.count} times`,
    },
    {
      icon: CalendarDays,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      text: `You order most on ${stats.favoriteDay}s`,
    },
    {
      icon: Clock,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      text: `Peak ordering time: ${stats.peakHour}`,
    },
    {
      icon: Moon,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      text: `${stats.lateNightOrders} late-night orders (after 10 PM)`,
    },
    {
      icon: Store,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      text: `You've ordered from ${stats.uniqueRestaurants} different restaurants`,
    },
    {
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/10",
      text: `You average ${stats.avgOrdersPerMonth} orders per month`,
    },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-semibold text-card-foreground mb-6">Fun Insights</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className={`w-8 h-8 ${insight.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <insight.icon className={`w-4 h-4 ${insight.color}`} />
            </div>
            <p className="text-sm text-card-foreground leading-relaxed">{insight.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
