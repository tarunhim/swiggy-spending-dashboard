"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CuisineData } from "@/types/swiggy";

interface CuisineChartProps {
  data: CuisineData[];
}

const COLORS = [
  "#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444",
  "#f59e0b", "#06b6d4", "#ec4899", "#14b8a6", "#6366f1",
  "#84cc16", "#e11d48", "#0ea5e9", "#a855f7", "#22c55e",
];

export default function CuisineChart({ data }: CuisineChartProps) {
  const [limit, setLimit] = useState<10 | 50 | "all">(10);
  const visible = limit === "all" ? data : data.slice(0, limit);
  const totalOrders = data.reduce((sum, cuisine) => sum + cuisine.orders, 0);

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h3 className="font-semibold text-card-foreground">
          Cuisine Breakdown ({visible.length}
          {limit !== "all" ? ` of ${data.length}` : ""})
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
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-48 h-48 flex-shrink-0">
          {visible.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={visible}
                  dataKey="orders"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {visible.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
              No cuisine data
            </div>
          )}
        </div>
        <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 w-full max-h-56 overflow-y-auto pr-1">
          {visible.map((c, i) => (
            <div key={c.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-sm text-card-foreground truncate">{c.name}</span>
              <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                {totalOrders > 0 ? Math.round((c.orders / totalOrders) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
