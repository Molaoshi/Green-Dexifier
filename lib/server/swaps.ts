import "server-only";
import { prisma } from "@/lib/prisma";

// Cross-provider swap tracking. Swaps are recorded at creation time and
// refreshed against provider status APIs (see swap-status.ts).

export const SWAP_PROVIDERS = ["rango", "exolix", "chainflip"] as const;
export type SwapProvider = (typeof SWAP_PROVIDERS)[number];

// Normalized statuses shared by all providers.
export const SWAP_STATUSES = ["running", "success", "failed", "refunded"] as const;
export type SwapStatus = (typeof SWAP_STATUSES)[number];

export interface SwapRecordInput {
  provider: string;
  externalId: string;
  status?: string;
  fromChain: string;
  fromToken: string;
  fromAmount: string;
  toChain: string;
  toToken: string;
  toAmount?: string | null;
  depositAddress?: string | null;
  recipientAddress?: string | null;
  depositHash?: string | null;
  settleHash?: string | null;
  feeUsd?: number | null;
  extra?: unknown;
}

const MAX_SHORT = 64;
const MAX_LONG = 256;

const clean = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t || t.length > max) return null;
  return t;
};

// Validates and normalizes a client/server-supplied record. Returns null
// when required fields are missing or malformed — callers must not store it.
export function validateSwapInput(raw: unknown): SwapRecordInput | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const provider = clean(r.provider, 16);
  if (!provider || !SWAP_PROVIDERS.includes(provider as SwapProvider)) return null;

  const externalId = clean(r.externalId, MAX_LONG);
  if (!externalId) return null;

  const fromChain = clean(r.fromChain, MAX_SHORT);
  const fromToken = clean(r.fromToken, MAX_SHORT);
  const toChain = clean(r.toChain, MAX_SHORT);
  const toToken = clean(r.toToken, MAX_SHORT);
  if (!fromChain || !fromToken || !toChain || !toToken) return null;
  // Amount may be unknown at creation for some providers (Chainflip fills it
  // in via status refresh) — empty is allowed, garbage is not.
  const rawAmount = String(r.fromAmount ?? "").trim();
  if (rawAmount.length > MAX_SHORT) return null;
  const fromAmount = rawAmount;

  let status: string | undefined;
  if (r.status !== undefined) {
    const s = clean(r.status, 16);
    if (!s || !SWAP_STATUSES.includes(s as SwapStatus)) return null;
    status = s;
  }

  const feeUsd =
    typeof r.feeUsd === "number" && Number.isFinite(r.feeUsd) && r.feeUsd >= 0
      ? r.feeUsd
      : null;

  return {
    provider,
    externalId,
    status,
    fromChain,
    fromToken,
    fromAmount,
    toChain,
    toToken,
    toAmount: clean(r.toAmount, MAX_SHORT),
    depositAddress: clean(r.depositAddress, MAX_LONG),
    recipientAddress: clean(r.recipientAddress, MAX_LONG),
    depositHash: clean(r.depositHash, MAX_LONG),
    settleHash: clean(r.settleHash, MAX_LONG),
    feeUsd,
    extra: r.extra ?? undefined,
  };
}

// Insert-or-update keyed on (provider, externalId): widget events can fire
// more than once, and both the creation route and the tracker may report.
export async function recordSwap(input: SwapRecordInput) {
  const { provider, externalId, status, extra, ...rest } = input;
  return prisma.swap.upsert({
    where: { provider_externalId: { provider, externalId } },
    create: {
      provider,
      externalId,
      status: status ?? "running",
      ...rest,
      ...(extra !== undefined ? { extra: extra as object } : {}),
    },
    update: {
      ...(status ? { status } : {}),
      ...Object.fromEntries(
        Object.entries(rest).filter(([, v]) => v !== null && v !== undefined),
      ),
      ...(extra !== undefined ? { extra: extra as object } : {}),
    },
  });
}

export const SWAPS_PAGE_SIZE = 14;

export async function listSwaps(page: number, status?: string) {
  const where =
    status && status !== "all" ? { status } : undefined;
  const [total, transactions] = await Promise.all([
    prisma.swap.count({ where }),
    prisma.swap.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: Math.max(0, page) * SWAPS_PAGE_SIZE,
      take: SWAPS_PAGE_SIZE,
    }),
  ]);
  return { total, transactions };
}

export async function getSwap(provider: string, externalId: string) {
  return prisma.swap.findUnique({
    where: { provider_externalId: { provider, externalId } },
  });
}

export async function getSwapById(id: string) {
  return prisma.swap.findUnique({ where: { id } });
}

export async function searchSwaps(query: string) {
  const q = query.trim();
  if (q.length < 3 || q.length > MAX_LONG) return [];
  return prisma.swap.findMany({
    where: {
      OR: [
        { externalId: { contains: q, mode: "insensitive" } },
        { depositHash: { contains: q, mode: "insensitive" } },
        { settleHash: { contains: q, mode: "insensitive" } },
        { depositAddress: { contains: q, mode: "insensitive" } },
        { recipientAddress: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getSwapSummary() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [totalTxCount, last24HoursTxCount, wallets, daily] = await Promise.all([
    prisma.swap.count(),
    prisma.swap.count({ where: { createdAt: { gte: since24h } } }),
    prisma.swap.findMany({
      where: { recipientAddress: { not: null } },
      select: { recipientAddress: true },
      distinct: ["recipientAddress"],
    }),
    prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT to_char(date_trunc('day', "createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
             count(*)::bigint AS count
      FROM "Swap"
      WHERE "createdAt" >= now() - interval '90 days'
      GROUP BY 1
      ORDER BY 1
    `,
  ]);
  return {
    totalTxCount,
    last24HoursTxCount,
    connectedWallets: wallets.length,
    dailyInterval: daily.map((d) => ({ day: d.day, count: Number(d.count) })),
  };
}
