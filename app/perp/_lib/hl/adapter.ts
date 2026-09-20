"use client";

// Hyperliquid venue adapter — normalizes REST + WS data into venue-agnostic
// shapes. Future venues (Aster, Lighter) implement these same functions.

import * as hl from "@nktkas/hyperliquid";
import { getInfoClient, getSubsClient } from "./clients";
import type {
  AccountSummary,
  BookLevel,
  Candle,
  Fill,
  OpenOrder,
  Position,
  Tape,
  VenueMarket,
} from "../venue/types";
import type { CandleInterval } from "../config";

const num = (v: string | number | null | undefined): number =>
  v == null ? 0 : typeof v === "number" ? v : parseFloat(v) || 0;

// ---------- Markets ----------

export async function fetchMarkets(): Promise<VenueMarket[]> {
  const [meta, ctxs] = await getInfoClient().metaAndAssetCtxs();
  return meta.universe
    .map((u, i) => {
      const ctx = ctxs[i];
      const markPx = num(ctx?.markPx);
      const prevDayPx = num(ctx?.prevDayPx);
      return {
        venue: "hyperliquid" as const,
        coin: u.name,
        assetId: i,
        szDecimals: u.szDecimals,
        maxLeverage: u.maxLeverage,
        onlyIsolated: u.onlyIsolated ?? false,
        markPx,
        oraclePx: num(ctx?.oraclePx),
        midPx: ctx?.midPx != null ? num(ctx.midPx) : null,
        prevDayPx: prevDayPx || null,
        change24h: prevDayPx ? (markPx - prevDayPx) / prevDayPx : null,
        volume24h: ctx ? num(ctx.dayNtlVlm) : null,
        funding: ctx ? num(ctx.funding) : null,
        openInterest: ctx ? num(ctx.openInterest) : null,
      };
    })
    .filter((m) => m.markPx > 0);
}

export function subscribeAllMids(
  cb: (mids: Record<string, number>) => void,
): Promise<{ unsubscribe: () => Promise<void> }> {
  return getSubsClient().allMids((e) => {
    const out: Record<string, number> = {};
    for (const [coin, px] of Object.entries(e.mids)) out[coin] = num(px);
    cb(out);
  });
}

/** Live perp context (mark/funding/OI/premium) for one coin. */
export function subscribeAssetCtx(
  coin: string,
  cb: (ctx: { markPx: number; funding: number; openInterest: number; oraclePx: number; dayNtlVlm: number; prevDayPx: number }) => void,
): Promise<{ unsubscribe: () => Promise<void> }> {
  return getSubsClient().activeAssetCtx({ coin }, (e) => {
    const c = e.ctx as {
      markPx?: string; funding?: string; openInterest?: string;
      oraclePx?: string; dayNtlVlm?: string; prevDayPx?: string;
    };
    cb({
      markPx: num(c.markPx),
      funding: num(c.funding),
      openInterest: num(c.openInterest),
      oraclePx: num(c.oraclePx),
      dayNtlVlm: num(c.dayNtlVlm),
      prevDayPx: num(c.prevDayPx),
    });
  });
}

// ---------- Book / Trades / Candles ----------

export function subscribeBook(
  coin: string,
  cb: (bids: BookLevel[], asks: BookLevel[]) => void,
): Promise<{ unsubscribe: () => Promise<void> }> {
  return getSubsClient().l2Book({ coin }, (e) => {
    const map = (lv: { px: string; sz: string; n: number }[]): BookLevel[] =>
      lv.map((l) => ({ px: num(l.px), sz: num(l.sz), n: l.n }));
    cb(map(e.levels[0]), map(e.levels[1]));
  });
}

export function subscribeTrades(
  coin: string,
  cb: (trades: Tape[]) => void,
): Promise<{ unsubscribe: () => Promise<void> }> {
  return getSubsClient().trades({ coin }, (list) => {
    cb(
      list.map((t) => ({
        px: num(t.px),
        sz: num(t.sz),
        side: t.side === "B" ? ("buy" as const) : ("sell" as const),
        time: t.time,
      })),
    );
  });
}

export async function fetchCandles(
  coin: string,
  interval: CandleInterval,
  lookbackMs: number,
): Promise<Candle[]> {
  const end = Date.now();
  const raw = await getInfoClient().candleSnapshot({
    coin,
    interval,
    startTime: end - lookbackMs,
    endTime: end,
  });
  return raw.map((c) => ({
    t: c.t,
    o: num(c.o),
    h: num(c.h),
    l: num(c.l),
    c: num(c.c),
    v: num(c.v),
  }));
}

export function subscribeCandle(
  coin: string,
  interval: CandleInterval,
  cb: (candle: Candle) => void,
): Promise<{ unsubscribe: () => Promise<void> }> {
  return getSubsClient().candle({ coin, interval }, (c) => {
    cb({ t: c.t, o: num(c.o), h: num(c.h), l: num(c.l), c: num(c.c), v: num(c.v) });
  });
}

// ---------- Account ----------

export async function fetchAccount(user: `0x${string}`): Promise<{
  summary: AccountSummary;
  positions: Position[];
}> {
  const state = await getInfoClient().clearinghouseState({ user });
  const s = state.crossMarginSummary;
  const summary: AccountSummary = {
    accountValue: num(s.accountValue),
    available: num(state.withdrawable),
    marginUsed: num(s.totalMarginUsed),
    totalNtlPos: num(s.totalNtlPos),
  };
  const positions: Position[] = state.assetPositions
    .map((ap) => {
      const p = ap.position;
      const size = num(p.szi);
      if (size === 0) return null;
      return {
        coin: p.coin,
        assetId: 0, // resolved by caller via markets map
        size,
        entryPx: num(p.entryPx),
        markPx: 0, // filled from mids
        positionValue: num(p.positionValue),
        unrealizedPnl: num(p.unrealizedPnl),
        returnOnEquity: num(p.returnOnEquity),
        leverage: p.leverage?.value ?? 0,
        isCross: p.leverage?.type === "cross",
        liquidationPx: p.liquidationPx != null ? num(p.liquidationPx) : null,
        marginUsed: num(p.marginUsed),
      } satisfies Position;
    })
    .filter((p): p is Position => p !== null);
  return { summary, positions };
}

export async function fetchOpenOrders(user: `0x${string}`): Promise<OpenOrder[]> {
  const raw = await getInfoClient().frontendOpenOrders({ user });
  return raw.map((o) => {
    const isTrigger = o.isTrigger ?? false;
    return {
      oid: o.oid,
      coin: o.coin,
      assetId: 0,
      side: o.side === "B" ? ("buy" as const) : ("sell" as const),
      limitPx: num(o.limitPx),
      sz: num(o.sz),
      reduceOnly: o.reduceOnly ?? false,
      isTrigger,
      triggerPx: isTrigger && "triggerPx" in o ? num((o as { triggerPx?: string }).triggerPx) : null,
      orderType: "orderType" in o ? String(o.orderType) : isTrigger ? "Trigger" : "Limit",
      time: o.timestamp,
    };
  });
}

export async function fetchFills(user: `0x${string}`): Promise<Fill[]> {
  const raw = await getInfoClient().userFills({ user });
  return raw
    .map((f) => ({
      coin: f.coin,
      px: num(f.px),
      sz: num(f.sz),
      side: f.side === "B" ? ("buy" as const) : ("sell" as const),
      time: f.time,
      closedPnl: num(f.closedPnl),
      fee: num(f.fee),
      dir: f.dir,
      hash: f.hash,
    }))
    .sort((a, b) => b.time - a.time);
}

/** Approved builder-fee cap for this user, in tenths of bps (0 = none). */
export async function fetchMaxBuilderFee(
  user: `0x${string}`,
  builder: `0x${string}`,
): Promise<number> {
  try {
    return await getInfoClient().maxBuilderFee({ user, builder });
  } catch {
    return 0;
  }
}

/** Live fill events for the connected user. */
export function subscribeUserFills(
  user: `0x${string}`,
  cb: () => void,
): Promise<{ unsubscribe: () => Promise<void> }> {
  return getSubsClient().userFills({ user }, () => cb());
}

/** Live order-status events for the connected user. */
export function subscribeOrderUpdates(
  user: `0x${string}`,
  cb: () => void,
): Promise<{ unsubscribe: () => Promise<void> }> {
  return getSubsClient().orderUpdates({ user }, () => cb());
}
