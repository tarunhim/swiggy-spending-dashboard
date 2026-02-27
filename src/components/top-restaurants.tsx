"use client";

import { RestaurantData } from "@/types/swiggy";
import { formatCurrency } from "@/lib/utils";

interface TopRestaurantsProps {
  restaurants: RestaurantData[];
}

export default function TopRestaurants({ restaurants }: TopRestaurantsProps) {
  const top10 = restaurants.slice(0, 10);
  const maxSpent = top10[0]?.totalSpent || 1;

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-semibold text-card-foreground mb-6">Top 10 Restaurants by Spend</h3>
      <div className="space-y-3">
        {top10.map((r, i) => (
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
      </div>
    </div>
  );
}
