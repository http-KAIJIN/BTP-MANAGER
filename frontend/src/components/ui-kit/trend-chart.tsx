"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyPoint } from "@/lib/dashboard-charts";
import { formatMAD, formatMADCompact } from "@/lib/format";

interface TrendChartProps {
  data: MonthlyPoint[];
  /** Chart color, defaults to brand orange (chart-1). */
  color?: string;
  type?: "area" | "bar";
}

function TooltipBox({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{formatMAD(payload[0].value)}</p>
    </div>
  );
}

export function TrendChart({
  data,
  color = "var(--chart-1)",
  type = "area",
}: TrendChartProps) {
  const gradientId = `grad-${color.replace(/[^a-z0-9]/gi, "")}`;

  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
      <XAxis
        dataKey="label"
        tickLine={false}
        axisLine={false}
        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        interval="preserveStartEnd"
      />
      <YAxis
        width={48}
        tickLine={false}
        axisLine={false}
        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        tickFormatter={(v) => formatMADCompact(v)}
        orientation="right"
      />
      <Tooltip content={<TooltipBox />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
    </>
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      {type === "bar" ? (
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          {axes}
          <Bar dataKey="total" fill={color} radius={[6, 6, 0, 0]} maxBarSize={42} />
        </BarChart>
      ) : (
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {axes}
          <Area
            type="monotone"
            dataKey="total"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      )}
    </ResponsiveContainer>
  );
}
