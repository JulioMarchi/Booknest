"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

type RevenuePoint = { label: string; total_revenue: number | null };

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  if (data.every((d) => !d.total_revenue)) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Sem vendas registradas neste período ainda.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: number) => formatCurrency(value)}
          width={72}
        />
        <Tooltip
          formatter={(value) => formatCurrency(typeof value === "number" ? value : 0)}
          contentStyle={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "0.5rem",
            fontSize: "0.75rem",
          }}
        />
        <Area
          type="monotone"
          dataKey="total_revenue"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#revenueFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
