"use client";

import { ItemData } from "@/types/swiggy";
import { formatCurrency } from "@/lib/utils";

interface TopItemsProps {
  items: ItemData[];
}

export default function TopItems({ items }: TopItemsProps) {
  const top10 = items.slice(0, 10);

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-semibold text-card-foreground mb-6">Most Ordered Items</h3>
      <div className="space-y-3">
        {top10.map((item, i) => (
          <div
            key={item.name}
            className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
          >
            <span className="text-2xl font-bold text-primary/30 w-8 text-right font-mono">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                Ordered {item.count} times · {formatCurrency(item.totalSpent)} total
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold text-card-foreground">{item.count}x</p>
            </div>
          </div>
        ))}
        {top10.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Item-level data not available for your orders
          </p>
        )}
      </div>
    </div>
  );
}
