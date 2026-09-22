import "server-only";
import { prisma } from "@/lib/prisma";
import { exolixGet } from "@/lib/server/exolix";
import { chainflipGet } from "@/lib/server/chainflip";
import type { Swap } from "@/generated/prisma/client";

// Refreshes non-final swaps against their provider's status API. Called
// lazily on explorer reads and from the daily sweep cron. Rango swaps are
// excluded: their status comes from widget events (the check-status API
// needs per-step tx hashes we don't have server-side).

type NormalizedStatus = "running" | "success" | "failed" | "refunded";

const EXOLIX_STATUS_MAP: Record<string, NormalizedStatus> = {
  success: "success",
  error: "failed",
  refunded: "refunded",
};

const CHAINFLIP_STATUS_MAP: Record<string, NormalizedStatus> = {
  COMPLETED: "success",
  FAILED: "failed",
};

export function mapExolixStatus(raw: string): NormalizedStatus {
  return EXOLIX_STATUS_MAP[raw.toLowerCase()] ?? "running";
}

export function mapChainflipStatus(raw: string): NormalizedStatus {
  return CHAINFLIP_STATUS_MAP[raw.toUpperCase()] ?? "running";
}

const isFinal = (s: string) => s !== "running";

async function refreshExolix(swap: Swap): Promise<void> {
  const data = await exolixGet<Record<string, any>>(`/transactions/${swap.externalId}`);
  const status = mapExolixStatus(String(data.status ?? ""));
  const hashOut = data.hashOut?.hash ?? null;
  const hashIn = data.hashIn?.hash ?? null;
  if (status === swap.status && !hashOut) return;
  await prisma.swap.update({
    where: { id: swap.id },
    data: {
      status,
      ...(hashIn ? { depositHash: hashIn } : {}),
      ...(hashOut ? { settleHash: hashOut } : {}),
      ...(data.amountTo != null ? { toAmount: String(data.amountTo) } : {}),
      extra: data as object,
    },
  });
}

async function refreshChainflip(swap: Swap): Promise<void> {
  const data = await chainflipGet<Record<string, any>>("/status-by-id", {
    swapId: swap.externalId,
  });
  const status = mapChainflipStatus(String(data.state ?? data.status ?? ""));
  const egressHash = data.swapEgress?.transactionReference ?? null;
  const depositAmount = data.deposit?.amount ?? null;
  const outputAmount = data.swapEgress?.amount ?? data.swap?.swappedOutputAmount ?? null;
  if (status === swap.status && !egressHash && !depositAmount) return;
  await prisma.swap.update({
    where: { id: swap.id },
    data: {
      status,
      ...(depositAmount != null && !swap.fromAmount
        ? { fromAmount: String(depositAmount) }
        : {}),
      ...(outputAmount != null ? { toAmount: String(outputAmount) } : {}),
      ...(egressHash ? { settleHash: egressHash } : {}),
      extra: data as object,
    },
  });
}

// Refresh one swap; never throws — a provider hiccup must not break reads.
export async function refreshSwap(swap: Swap): Promise<void> {
  if (isFinal(swap.status)) return;
  try {
    if (swap.provider === "exolix") await refreshExolix(swap);
    else if (swap.provider === "chainflip") await refreshChainflip(swap);
    // rango: status arrives via widget events, nothing to poll server-side
  } catch (error) {
    console.debug(`swap refresh failed for ${swap.provider}:${swap.externalId}:`, error);
  }
}

// Sweep used by the daily cron: refresh everything still non-final.
export async function sweepStaleSwaps(limit = 100): Promise<number> {
  const stale = await prisma.swap.findMany({
    where: { status: "running", provider: { in: ["exolix", "chainflip"] } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  for (const swap of stale) {
    await refreshSwap(swap);
  }
  return stale.length;
}
