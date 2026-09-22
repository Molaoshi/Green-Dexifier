import Link from "next/link";
import { notFound } from "next/navigation";
import dayjs from "dayjs";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  ExternalLink,
  CircleCheck,
  CircleX,
  Loader,
  Clock,
} from "lucide-react";
import { getSwap } from "@/lib/swaps";
import { mapStatus, PROVIDER_TITLES } from "@/lib/types";
import { formatAmount, formatUsd, cn } from "@/lib/utils";
import { txExplorerUrl, shortHash } from "@/lib/chains";
import TokenBadge from "@/components/token-badge";
import CopyButton from "@/components/copy-button";
import AutoRefresh from "@/components/auto-refresh";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return { title: `Swap ${shortHash(decodeURIComponent(id), 8, 6)}` };
}

function TimelineItem({
  state,
  title,
  children,
  last,
}: {
  state: "done" | "active" | "pending" | "failed";
  title: string;
  children?: React.ReactNode;
  last?: boolean;
}) {
  const icons = {
    done: <CircleCheck className="h-5 w-5 text-primary" />,
    active: <Loader className="h-5 w-5 animate-spin text-warning" />,
    pending: <Clock className="h-5 w-5 text-neutral-600" />,
    failed: <CircleX className="h-5 w-5 text-error" />,
  };
  return (
    <li className="relative flex gap-3 pb-6">
      {!last && (
        <span
          className={cn(
            "absolute left-[9px] top-6 h-full w-px",
            state === "done" ? "bg-primary/40" : "bg-white/10",
          )}
        />
      )}
      <span className="relative z-10 shrink-0 bg-transparent">{icons[state]}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-white">{title}</div>
        {children}
      </div>
    </li>
  );
}

function HashLink({ chain, hash, label }: { chain: string; hash: string; label: string }) {
  const url = txExplorerUrl(chain, hash);
  return (
    <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-400">
      <span>{label}:</span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="tnum flex items-center gap-1 text-primary transition-colors hover:text-primary-dark"
        >
          {shortHash(hash, 10, 8)}
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span className="tnum">{shortHash(hash, 10, 8)}</span>
      )}
      <CopyButton value={hash} />
    </div>
  );
}

function AddressRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="shrink-0 text-xs text-neutral-500">{label}</span>
      {value ? (
        <span className="tnum flex min-w-0 items-center text-xs text-neutral-200">
          <span className="hidden sm:inline">{value}</span>
          <span className="sm:hidden">{shortHash(value, 8, 6)}</span>
          <CopyButton value={value} />
        </span>
      ) : (
        <span className="text-xs text-neutral-600">—</span>
      )}
    </div>
  );
}

export default async function SwapDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const swap = await getSwap(decodeURIComponent(id));
  if (!swap) notFound();

  const status = mapStatus(swap.status);
  const isRunning = status === "running";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {isRunning && <AutoRefresh />}

      <Link
        href="/transactions"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-400 transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        All swaps
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-xl font-bold text-white sm:text-2xl">Swap details</h1>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider",
            status === "success" && "bg-primary/15 text-primary",
            status === "failed" && "bg-error/15 text-error",
            status === "running" && "bg-warning/15 text-warning",
          )}
        >
          {status}
        </span>
        <span className="ml-auto rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-neutral-300">
          {PROVIDER_TITLES[swap.provider] ?? swap.provider}
        </span>
      </div>

      {/* From → To */}
      <div className="glass-card mb-6 rounded-2xl p-6">
        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex-1 rounded-xl border border-white/5 bg-black/20 p-4">
            <div className="mb-2 text-[11px] uppercase tracking-wider text-neutral-500">From</div>
            <div className="tnum font-display text-2xl font-bold text-white">
              {formatAmount(swap.fromAmount)}{" "}
              <span className="text-base font-semibold text-neutral-300">
                {swap.fromToken.toUpperCase()}
              </span>
            </div>
            <div className="mt-2">
              <TokenBadge symbol={swap.fromToken} chain={swap.fromChain} size="sm" />
            </div>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight className="hidden h-6 w-6 text-primary sm:block" />
            <ArrowDown className="h-6 w-6 text-primary sm:hidden" />
          </div>

          <div className="flex-1 rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
            <div className="mb-2 text-[11px] uppercase tracking-wider text-neutral-500">To</div>
            <div className="tnum font-display text-2xl font-bold text-white">
              {swap.toAmount ? (
                <>
                  {formatAmount(swap.toAmount)}{" "}
                  <span className="text-base font-semibold text-neutral-300">
                    {swap.toToken.toUpperCase()}
                  </span>
                </>
              ) : (
                <span className="text-base text-neutral-500">Pending…</span>
              )}
            </div>
            <div className="mt-2">
              <TokenBadge symbol={swap.toToken} chain={swap.toChain} size="sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Timeline */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-white">Progress</h2>
          <ul>
            <TimelineItem state="done" title="Swap created">
              <div className="mt-1 text-xs text-neutral-500">
                {dayjs(swap.createdAt).format("MMM D, YYYY HH:mm:ss UTC")}
              </div>
            </TimelineItem>
            <TimelineItem
              state={swap.depositHash ? "done" : status === "failed" ? "failed" : "active"}
              title={swap.depositHash ? "Deposit confirmed" : "Awaiting deposit"}
              last={!swap.depositHash || !swap.settleHash}
            >
              {swap.depositHash && (
                <HashLink chain={swap.fromChain} hash={swap.depositHash} label="Tx" />
              )}
            </TimelineItem>
            {(swap.depositHash || swap.settleHash) && (
              <TimelineItem
                state={
                  swap.settleHash ? "done" : status === "failed" ? "failed" : "active"
                }
                title={
                  swap.settleHash
                    ? "Delivered to recipient"
                    : status === "failed"
                      ? "Swap failed"
                      : "Settling on destination chain"
                }
                last
              >
                {swap.settleHash && (
                  <HashLink chain={swap.toChain} hash={swap.settleHash} label="Tx" />
                )}
              </TimelineItem>
            )}
          </ul>
        </div>

        {/* Details */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-white">Details</h2>
          <div className="divide-y divide-white/5">
            <div className="flex items-center justify-between gap-4 py-2.5">
              <span className="text-xs text-neutral-500">Request ID</span>
              <span className="tnum flex min-w-0 items-center text-xs text-neutral-200">
                <span className="hidden sm:inline">{swap.externalId}</span>
                <span className="sm:hidden">{shortHash(swap.externalId, 8, 6)}</span>
                <CopyButton value={swap.externalId} />
              </span>
            </div>
            <AddressRow label="Deposit address" value={swap.depositAddress} />
            <AddressRow label="Recipient address" value={swap.recipientAddress} />
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-neutral-500">Fee</span>
              <span className="tnum text-xs text-neutral-200">{formatUsd(swap.feeUsd)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-neutral-500">Created</span>
              <span className="text-xs text-neutral-200">
                {dayjs(swap.createdAt).format("MMM D, YYYY HH:mm")}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-neutral-500">Last update</span>
              <span className="text-xs text-neutral-200">
                {dayjs(swap.updatedAt).format("MMM D, YYYY HH:mm")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
