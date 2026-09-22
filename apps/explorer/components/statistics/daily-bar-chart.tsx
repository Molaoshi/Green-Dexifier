"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dayjs from "dayjs";
import type { BlockchainMeta, BreakDownBy, DailySummaryPoint } from "@/lib/types";
import { cn } from "@/lib/utils";

// Neon-adjacent palette for stacked series.
const SERIES_COLORS = ["#13F187", "#00e0a0", "#7dd3fc", "#c084fc", "#f5b524", "#5F5F5F"];
const MAX_SERIES = 5;

const compactUsd = (v: number) =>
  v >= 1_000_000
    ? `$${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
      ? `$${(v / 1_000).toFixed(1)}K`
      : `$${v.toFixed(0)}`;

interface Props {
  title: string;
  description: string;
  metric: "count" | "volume";
  days: number;
  blockchains: BlockchainMeta[];
}

export default function DailyBarChart({ title, description, metric, days, blockchains }: Props) {
  const [breakDownBy, setBreakDownBy] = useState<BreakDownBy>("TOTAL");
  const [chain, setChain] = useState<string>("");
  const [data, setData] = useState<DailySummaryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        let url = `/api/stats/scanner/summary/daily?days=${days}&breakDownBy=${breakDownBy}`;
        if (breakDownBy !== "TOTAL" && chain) {
          url += breakDownBy === "SOURCE" ? `&source=${chain}` : `&destination=${chain}`;
        }
        const res = await fetch(url);
        const json = await res.json().catch(() => ({}));
        if (!cancelled) setData(Array.isArray(json) ? json : (json?.stats ?? []));
      } catch {
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [days, breakDownBy, chain]);

  const { points, seriesKeys } = useMemo(() => {
    const valueOf = (d: DailySummaryPoint) => (metric === "count" ? d.count : d.volume);

    if (breakDownBy === "TOTAL") {
      return {
        points: data.map((d) => ({
          label: dayjs(d.date).format("MMM D"),
          Total: valueOf(d),
        })),
        seriesKeys: ["Total"],
      };
    }

    // Bucketed: keep top buckets by total value, fold the rest into "Other".
    const totals = new Map<string, number>();
    for (const d of data) {
      totals.set(d.bucket, (totals.get(d.bucket) ?? 0) + valueOf(d));
    }
    const top = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_SERIES)
      .map(([k]) => k);

    const byDate = new Map<string, Record<string, number | string>>();
    for (const d of data) {
      const label = dayjs(d.date).format("MMM D");
      const row = byDate.get(label) ?? { label };
      const key = top.includes(d.bucket) ? d.bucket : "Other";
      row[key] = (Number(row[key]) || 0) + valueOf(d);
      byDate.set(label, row);
    }
    return {
      points: [...byDate.values()],
      seriesKeys: totals.has("Other") || totals.size > MAX_SERIES ? [...top, "Other"] : top,
    };
  }, [data, breakDownBy, metric]);

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h2 className="font-display text-base font-semibold text-white">{title}</h2>
          <p className="text-xs text-neutral-500">{description}</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-0.5 text-xs">
          {(["TOTAL", "SOURCE", "DESTINATION"] as BreakDownBy[]).map((b) => (
            <button
              key={b}
              onClick={() => {
                setBreakDownBy(b);
                setChain("");
              }}
              className={cn(
                "rounded-md px-2.5 py-1 transition-colors",
                breakDownBy === b ? "bg-primary font-medium text-black" : "text-neutral-400 hover:text-white",
              )}
            >
              {b === "TOTAL" ? "Total" : b === "SOURCE" ? "By source" : "By destination"}
            </button>
          ))}
        </div>
        {breakDownBy !== "TOTAL" && (
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            className="h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white outline-none focus:border-primary/50"
          >
            <option value="">All chains</option>
            {blockchains.map((b) => (
              <option key={b.name} value={b.name}>
                {b.displayName || b.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={cn("h-64 w-full transition-opacity", loading && "opacity-40")}>
        {points.length === 0 && !loading ? (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            No data for this filter.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -14 }}>
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
                tickFormatter={metric === "volume" ? compactUsd : undefined}
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
                formatter={(value) => [
                  metric === "volume" ? compactUsd(Number(value)) : String(value),
                ]}
              />
              {seriesKeys.length > 1 && (
                <Legend wrapperStyle={{ fontSize: 11, color: "#a3a3a3" }} />
              )}
              {seriesKeys.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="s"
                  fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                  radius={i === seriesKeys.length - 1 ? [3, 3, 0, 0] : 0}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
