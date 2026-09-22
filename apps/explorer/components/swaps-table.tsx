import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ArrowRight } from "lucide-react";
import type { SwapRow } from "@/lib/types";
import { mapStatus, PROVIDER_TITLES } from "@/lib/types";
import { formatAmount } from "@/lib/utils";
import { shortHash } from "@/lib/chains";
import StatusBadge from "./status-badge";
import TokenBadge from "./token-badge";
import CopyButton from "./copy-button";

dayjs.extend(relativeTime);

export default function SwapsTable({ swaps }: { swaps: SwapRow[] }) {
  if (swaps.length === 0) {
    return (
      <div className="glass-card rounded-2xl px-6 py-14 text-center text-sm text-neutral-400">
        No swaps found.
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-neutral-500">
              <th className="px-5 py-3.5 font-medium">Status</th>
              <th className="px-5 py-3.5 font-medium">From</th>
              <th className="px-5 py-3.5 font-medium" />
              <th className="px-5 py-3.5 font-medium">To</th>
              <th className="px-5 py-3.5 font-medium">Provider</th>
              <th className="px-5 py-3.5 font-medium">Request ID</th>
              <th className="px-5 py-3.5 text-right font-medium">Age</th>
            </tr>
          </thead>
          <tbody>
            {swaps.map((swap) => (
              <tr
                key={swap.id}
                className="group border-b border-white/[0.03] transition-colors last:border-0 hover:bg-primary/[0.04]"
              >
                <td className="px-5 py-4">
                  <Link href={`/swap/${encodeURIComponent(swap.externalId)}`} className="block">
                    <StatusBadge status={mapStatus(swap.status)} />
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <Link href={`/swap/${encodeURIComponent(swap.externalId)}`} className="block">
                    <div className="flex items-center gap-2.5">
                      <TokenBadge symbol={swap.fromToken} chain={swap.fromChain} size="sm" />
                      <span className="tnum text-sm font-medium text-white">
                        {formatAmount(swap.fromAmount)}
                      </span>
                    </div>
                  </Link>
                </td>
                <td className="px-1 py-4 text-neutral-600">
                  <ArrowRight className="h-4 w-4" />
                </td>
                <td className="px-5 py-4">
                  <Link href={`/swap/${encodeURIComponent(swap.externalId)}`} className="block">
                    <div className="flex items-center gap-2.5">
                      <TokenBadge symbol={swap.toToken} chain={swap.toChain} size="sm" />
                      <span className="tnum text-sm font-medium text-white">
                        {swap.toAmount ? formatAmount(swap.toAmount) : "—"}
                      </span>
                    </div>
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-neutral-300">
                    {PROVIDER_TITLES[swap.provider] ?? swap.provider}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="flex items-center text-xs text-neutral-400">
                    <span className="tnum">{shortHash(swap.externalId)}</span>
                    <CopyButton value={swap.externalId} />
                  </span>
                </td>
                <td className="px-5 py-4 text-right text-xs text-neutral-500">
                  {dayjs(swap.createdAt).fromNow()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="divide-y divide-white/5 md:hidden">
        {swaps.map((swap) => (
          <Link
            key={swap.id}
            href={`/swap/${encodeURIComponent(swap.externalId)}`}
            className="block px-4 py-4 transition-colors hover:bg-primary/[0.04]"
          >
            <div className="mb-2.5 flex items-center justify-between">
              <StatusBadge status={mapStatus(swap.status)} />
              <span className="text-[11px] text-neutral-500">
                {dayjs(swap.createdAt).fromNow()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TokenBadge symbol={swap.fromToken} chain={swap.fromChain} size="sm" />
              <span className="tnum text-sm font-medium text-white">
                {formatAmount(swap.fromAmount)}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
              <TokenBadge symbol={swap.toToken} chain={swap.toChain} size="sm" />
              <span className="tnum text-sm font-medium text-white">
                {swap.toAmount ? formatAmount(swap.toAmount) : "—"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-neutral-300">
                {PROVIDER_TITLES[swap.provider] ?? swap.provider}
              </span>
              <span className="tnum text-[11px] text-neutral-500">
                {shortHash(swap.externalId)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
