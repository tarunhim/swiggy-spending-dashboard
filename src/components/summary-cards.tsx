"use client";

import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Truck,
  Percent,
  Crown,
} from "lucide-react";
import { SummaryStats } from "@/types/swiggy";
import { formatCurrency, formatDate } from "@/lib/utils";

interface SummaryCardsProps {
  stats: SummaryStats;
}

export default function SummaryCards({ stats }: SummaryCardsProps) {
  const cards = [
    {
      label: "Total Spent",
      value: formatCurrency(stats.totalSpent),
      icon: IndianRupee,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders.toLocaleString("en-IN"),
      icon: ShoppingBag,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Avg Order Value",
      value: formatCurrency(stats.avgOrderValue),
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Delivery Fees",
      value: formatCurrency(stats.totalDeliveryFees),
      icon: Truck,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Total Savings",
      value: formatCurrency(stats.totalSavings),
      icon: Percent,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Most Expensive Order",
      value: formatCurrency(stats.mostExpensiveOrder.amount),
      sub: `${stats.mostExpensiveOrder.restaurant} · ${stats.mostExpensiveOrder.date ? formatDate(stats.mostExpensiveOrder.date) : ""}`,
      icon: Crown,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-colors"
        >
          <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
            <card.icon className={`w-4.5 h-4.5 ${card.color}`} />
          </div>
          <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
          <p className="text-lg font-bold text-card-foreground leading-tight">{card.value}</p>
          {card.sub && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{card.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
