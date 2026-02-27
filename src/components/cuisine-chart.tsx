"use client";

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
  const top8 = data.slice(0, 8);
  const total = top8.reduce((s, c) => s + c.orders, 0);

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-semibold text-card-foreground mb-6">Cuisine Breakdown</h3>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-48 h-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={top8}
                dataKey="orders"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                strokeWidth={0}
              >
                {top8.map((_, i) => (
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
        </div>
        <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 w-full">
          {top8.map((c, i) => (
            <div key={c.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-sm text-card-foreground truncate">{c.name}</span>
              <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                {total > 0 ? Math.round((c.orders / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
