import Link from "next/link";
import { Activity, ArrowRight, ArrowLeftRight, Users, Network } from "lucide-react";
import { getSummary, getSwaps } from "@/lib/swaps";
import { formatCount } from "@/lib/utils";
import StatCard from "@/components/stat-card";
import DailyChart from "@/components/daily-chart";
import SwapsTable from "@/components/swaps-table";
import HeroSearch from "@/components/hero-search";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [summary, swapsData] = await Promise.all([getSummary(), getSwaps(0)]);

  const daily = (summary?.dailyInterval ?? [])
    .map((d) => ({ date: d.day, count: d.count }))
    .filter((d) => Boolean(d.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      {/* Hero */}
      <section className="py-14 text-center sm:py-20">
        <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Every swap, <span className="text-primary text-glow">on the record.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-neutral-400 sm:text-base">
          Track cross-chain swaps routed through Dexifier — status, amounts and
          on-chain transaction links, in real time.
        </p>
        <div className="mt-8">
          <HeroSearch />
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label="24h Swaps"
          value={formatCount(summary?.last24HoursTxCount)}
        />
        <StatCard
          icon={ArrowLeftRight}
          label="Total Swaps"
          value={formatCount(summary?.totalTxCount)}
        />
        <StatCard
          icon={Users}
          label="Unique Wallets"
          value={formatCount(summary?.connectedWallets)}
        />
        <StatCard
          icon={Network}
          label="Routing Coverage"
          value="55+"
          hint="chains · 144 DEXes · 31 bridges"
        />
      </section>

      {/* Chart */}
      {daily.length > 0 && (
        <section className="mt-6">
          <DailyChart data={daily} />
        </section>
      )}

      {/* Recent swaps */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">
            Recent swaps
          </h2>
          <Link
            href="/transactions"
            className="flex items-center gap-1 text-sm text-primary transition-colors hover:text-primary-dark"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <SwapsTable swaps={swapsData?.transactions ?? []} />
      </section>
    </div>
  );
}
