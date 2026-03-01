"use client";

import { useState } from "react";
import { RestaurantData } from "@/types/swiggy";
import { formatCurrency } from "@/lib/utils";

interface TopRestaurantsProps {
  restaurants: RestaurantData[];
}

export default function TopRestaurants({ restaurants }: TopRestaurantsProps) {
  const [limit, setLimit] = useState<10 | 50 | "all">(10);
  const visible = limit === "all" ? restaurants : restaurants.slice(0, limit);
  const maxSpent = visible[0]?.totalSpent || 1;

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h3 className="font-semibold text-card-foreground">
          Top Restaurants by Spend ({visible.length}
          {limit !== "all" ? ` of ${restaurants.length}` : ""})
        </h3>
        <div className="flex bg-muted rounded-lg p-0.5">
          {(
            [
              { label: "Top 10", value: 10 as const },
              { label: "Top 50", value: 50 as const },
              { label: "All", value: "all" as const },
            ] as const
          ).map((option) => (
            <button
              key={option.label}
              onClick={() => setLimit(option.value)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                limit === option.value
                  ? "bg-card text-card-foreground shadow-sm"
                  : "text-muted-foreground hover:text-card-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {visible.map((r, i) => (
          <div key={r.name} className="flex items-center gap-3">
            <span className="text-sm font-mono text-muted-foreground w-5 text-right">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-card-foreground truncate pr-2">
                  {r.name}
                </p>
                <span className="text-sm font-semibold text-card-foreground flex-shrink-0">
                  {formatCurrency(r.totalSpent)}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(r.totalSpent / maxSpent) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {r.orders} orders · Avg {formatCurrency(r.avgOrderValue)}
              </p>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No restaurant data available.
          </p>
        )}
      </div>
    </div>
  );
}
