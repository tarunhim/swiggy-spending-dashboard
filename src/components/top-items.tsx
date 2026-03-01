"use client";

import { useState } from "react";
import { ItemData } from "@/types/swiggy";
import { formatCurrency } from "@/lib/utils";

interface TopItemsProps {
  items: ItemData[];
}

export default function TopItems({ items }: TopItemsProps) {
  const [limit, setLimit] = useState<10 | 50 | "all">(10);
  const visible = limit === "all" ? items : items.slice(0, limit);

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h3 className="font-semibold text-card-foreground">
          Most Ordered Items ({visible.length}
          {limit !== "all" ? ` of ${items.length}` : ""})
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
        {visible.map((item, i) => (
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
        {visible.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Item-level data not available for your orders
          </p>
        )}
      </div>
    </div>
  );
}
