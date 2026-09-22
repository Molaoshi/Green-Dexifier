import type { BlockchainMeta, BlockchainValue, PathValue } from "@/lib/types";
import ChainLogo from "@/components/chain-logo";
import { ArrowRight } from "lucide-react";

const compactUsd = (v: number) =>
  v >= 1_000_000
    ? `$${(v / 1_000_000).toFixed(2)}M`
    : v >= 1_000
      ? `$${(v / 1_000).toFixed(1)}K`
      : `$${v.toFixed(2)}`;

interface Props {
  title: string;
  description: string;
  type: "blockchain" | "path";
  items: (BlockchainValue | PathValue)[] | undefined;
  isVolume?: boolean;
  meta: Map<string, BlockchainMeta>;
}

export default function TopListCard({ title, description, type, items, isVolume, meta }: Props) {
  const rows = (items ?? []).slice(0, 5);
  const max = rows.reduce((m, r) => Math.max(m, r.value), 0);

  const chainMeta = (name: string) => meta.get(name);

  return (
    <div className="glass-card rounded-2xl p-5">
      <h3 className="font-display text-sm font-semibold text-white">{title}</h3>
      <p className="mb-4 text-xs text-neutral-500">{description}</p>
      {rows.length === 0 ? (
        <div className="py-6 text-center text-xs text-neutral-600">No data yet.</div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, i) => {
            const isPath = type === "path";
            const pathKey = isPath ? (row as PathValue).key : null;
            const chainKey = !isPath ? (row as BlockchainValue).key : null;
            const label = isPath
              ? null
              : (chainMeta(chainKey!)?.displayName ?? chainKey);
            const pct = max > 0 ? Math.max(4, Math.round((row.value / max) * 100)) : 4;

            return (
              <li key={i}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  {isPath && pathKey ? (
                    <span className="flex min-w-0 items-center gap-1.5 text-neutral-200">
                      <ChainLogo name={pathKey.source} logo={chainMeta(pathKey.source)?.logo} size="sm" />
                      <span className="truncate">{chainMeta(pathKey.source)?.displayName ?? pathKey.source}</span>
                      <ArrowRight className="h-3 w-3 shrink-0 text-neutral-600" />
                      <ChainLogo name={pathKey.destination} logo={chainMeta(pathKey.destination)?.logo} size="sm" />
                      <span className="truncate">{chainMeta(pathKey.destination)?.displayName ?? pathKey.destination}</span>
                    </span>
                  ) : (
                    <span className="flex min-w-0 items-center gap-1.5 text-neutral-200">
                      <ChainLogo name={chainKey!} logo={chainMeta(chainKey!)?.logo} size="sm" />
                      <span className="truncate">{label}</span>
                    </span>
                  )}
                  <span className="tnum shrink-0 font-medium text-white">
                    {isVolume ? compactUsd(row.value) : row.value.toLocaleString("en-US")}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-dark to-primary"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
