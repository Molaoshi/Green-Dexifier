"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dayjs from "dayjs";

interface Point {
  date: string;
  count: number;
}

export default function DailyChart({ data }: { data: Point[] }) {
  if (!data || data.length === 0) return null;

  const points = data.map((d) => ({
    date: d.date,
    label: dayjs(d.date).format("MMM D"),
    count: d.count,
  }));

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-white">
            Daily activity
          </h2>
          <p className="text-xs text-neutral-500">Swaps per day, all providers</p>
        </div>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="countFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#13F187" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#13F187" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#737373", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: "#737373", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "#06130c",
                border: "1px solid rgba(19,241,135,0.25)",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: "#a3a3a3" }}
              itemStyle={{ color: "#13F187" }}
              formatter={(value) => [String(value), "Swaps"]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#13F187"
              strokeWidth={2}
              fill="url(#countFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
