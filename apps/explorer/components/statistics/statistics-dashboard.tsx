"use client";

import { useEffect, useMemo, useState } from "react";
import type { BlockchainMeta, StatisticDays, TopListSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import PasswordGate from "./password-gate";
import DailyBarChart from "./daily-bar-chart";
import TopListCard from "./top-list-card";
import SankeyChart from "./sankey-chart";

const DAY_FILTERS: StatisticDays[] = [7, 30, 90];

export default function StatisticsDashboard() {
  const [unlocked, setUnlocked] = useState(false);
  const [days, setDays] = useState<StatisticDays>(90);
  const [blockchains, setBlockchains] = useState<BlockchainMeta[]>([]);
  const [topLists, setTopLists] = useState<TopListSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!unlocked) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [chainsRes, topRes] = await Promise.all([
          fetch("/api/stats/meta/blockchains"),
          fetch(`/api/stats/scanner/summary/top-lists?days=${days}`),
        ]);
        const chains = await chainsRes.json().catch(() => []);
        const top = await topRes.json().catch(() => null);
        if (!cancelled) {
          setBlockchains(Array.isArray(chains) ? chains : []);
          setTopLists(top && typeof top === "object" ? top : null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [unlocked, days]);

  const meta = useMemo(() => {
    const map = new Map<string, BlockchainMeta>();
    for (const b of blockchains) map.set(b.name, b);
    return map;
  }, [blockchains]);

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Statistics</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Routing analytics across the Rango network
          </p>
        </div>
        <div className="flex gap-1.5 rounded-xl border border-white/10 bg-white/5 p-1">
          {DAY_FILTERS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-sm transition-colors",
                days === d
                  ? "bg-primary font-medium text-black"
                  : "text-neutral-400 hover:text-white",
              )}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      <div className={cn("space-y-6 transition-opacity", loading && "opacity-50")}>
        <DailyBarChart
          title="Transactions"
          description="Number of swaps per day"
          metric="count"
          days={days}
          blockchains={blockchains}
        />
        <DailyBarChart
          title="Volume"
          description="Transfer volume per day"
          metric="volume"
          days={days}
          blockchains={blockchains}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <TopListCard
            title="Top Paths"
            description="By number of swaps"
            type="path"
            items={topLists?.topPathsByTxCount}
            meta={meta}
          />
          <TopListCard
            title="Top Sources"
            description="By number of swaps"
            type="blockchain"
            items={topLists?.topSourceByTxCount}
            meta={meta}
          />
          <TopListCard
            title="Top Destinations"
            description="By number of swaps"
            type="blockchain"
            items={topLists?.topDestinationByTxCount}
            meta={meta}
          />
          <TopListCard
            title="Top Paths"
            description="By volume"
            type="path"
            items={topLists?.topPathsByVolume}
            isVolume
            meta={meta}
          />
          <TopListCard
            title="Top Sources"
            description="By volume"
            type="blockchain"
            items={topLists?.topSourceByVolume}
            isVolume
            meta={meta}
          />
          <TopListCard
            title="Top Destinations"
            description="By volume"
            type="blockchain"
            items={topLists?.topDestinationByVolume}
            isVolume
            meta={meta}
          />
        </div>

        <SankeyChart paths={topLists?.topPathsByVolume} meta={meta} />
      </div>
    </div>
  );
}
