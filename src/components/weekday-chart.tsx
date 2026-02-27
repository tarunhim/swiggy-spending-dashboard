"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { WeekdayData } from "@/types/swiggy";
import { formatCurrency } from "@/lib/utils";

interface WeekdayChartProps {
  data: WeekdayData[];
}

export default function WeekdayChart({ data }: WeekdayChartProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-semibold text-card-foreground mb-6">Orders by Day of Week</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="day"
              tickFormatter={(v) => v.slice(0, 3)}
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: "13px",
              }}
              formatter={(value, name) => [
                name === "amount" ? formatCurrency(value as number) : value,
                name === "amount" ? "Spent" : "Orders",
              ]}
            />
            <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
