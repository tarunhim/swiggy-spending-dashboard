"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { MonthlyData, YearlyData } from "@/types/swiggy";
import { formatCurrency } from "@/lib/utils";

interface SpendingChartProps {
  monthly: MonthlyData[];
  yearly: YearlyData[];
}

export default function SpendingChart({ monthly, yearly }: SpendingChartProps) {
  const [view, setView] = useState<"monthly" | "yearly">("monthly");
  const data = view === "monthly" ? monthly.slice(-12) : yearly;
  const xKey = view === "monthly" ? "month" : "year";

  const formatLabel = (val: string) => {
    if (view === "monthly") {
      const [y, m] = val.split("-");
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
    }
    return val;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-card-foreground">Spending Over Time</h3>
        <div className="flex bg-muted rounded-lg p-0.5">
          {(["monthly", "yearly"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                view === v
                  ? "bg-card text-card-foreground shadow-sm"
                  : "text-muted-foreground hover:text-card-foreground"
              }`}
            >
              {v === "monthly" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey={xKey}
              tickFormatter={formatLabel}
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: "13px",
              }}
              formatter={(value) => [formatCurrency(value as number), "Spent"]}
              labelFormatter={(label) => formatLabel(String(label))}
            />
            <Bar dataKey="amount" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
