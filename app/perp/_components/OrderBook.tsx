"use client";

import React, { useMemo } from "react";
import { usePerp } from "../_lib/store";
import { fmtPx, fmtSz } from "../_lib/format";

const LEVELS = 11;

function Row({
  level,
  total,
  maxTotal,
  side,
}: {
  level: { px: number; sz: number };
  total: number;
  maxTotal: number;
  side: "bid" | "ask";
}) {
  const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  return (
    <div className="relative grid grid-cols-3 px-3 py-[2.5px] text-[11px]">
      <span
        className={`perp-depth ${side === "bid" ? "perp-depth-bid" : "perp-depth-ask"}`}
        style={{ width: `${pct}%` }}
      />
      <span className={`num relative ${side === "bid" ? "text-[var(--up)]" : "text-[var(--down)]"}`}>
        {fmtPx(level.px)}
      </span>
      <span className="num relative text-right text-white/75">{fmtSz(level.sz, 4)}</span>
      <span className="num relative text-right text-[var(--meta)]">{fmtSz(total, 4)}</span>
    </div>
  );
}

export default function OrderBook() {
  const { bids, asks, selected } = usePerp();

  const { askRows, bidRows, maxTotal, spread, spreadPct } = useMemo(() => {
    const a = asks.slice(0, LEVELS);
    const b = bids.slice(0, LEVELS);
    const cum = (rows: typeof a) => {
      let t = 0;
      return rows.map((r) => (t += r.sz));
    };
    const askTotals = cum(a);
    const bidTotals = cum(b);
    const bestAsk = a[0]?.px ?? null;
    const bestBid = b[0]?.px ?? null;
    const sp = bestAsk != null && bestBid != null ? bestAsk - bestBid : null;
    return {
      askRows: a.map((level, i) => ({ level, total: askTotals[i] })),
      bidRows: b.map((level, i) => ({ level, total: bidTotals[i] })),
      maxTotal: Math.max(askTotals.at(-1) ?? 0, bidTotals.at(-1) ?? 0),
      spread: sp,
      spreadPct: sp != null && bestAsk ? (sp / bestAsk) * 100 : null,
    };
  }, [bids, asks]);

  const mid = selected?.midPx ?? selected?.markPx ?? null;

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-3 border-b border-[var(--line)] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--meta)]">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>
      <div className="perp-scroll min-h-0 flex-1 overflow-y-auto py-1">
        {/* Asks: rendered top→bottom ascending so best ask sits at the spread */}
        <div className="flex flex-col-reverse">
          {askRows.map((r, i) => (
            <Row key={`a${i}`} level={r.level} total={r.total} maxTotal={maxTotal} side="ask" />
          ))}
          {askRows.length === 0 && <BookSkeleton />}
        </div>

        <div className="my-1 flex items-center justify-between border-y border-[var(--line)] px-3 py-1.5">
          <span className="num text-[13px] font-bold text-white/90">{fmtPx(mid)}</span>
          <span className="num text-[10px] text-[var(--meta)]">
            Spread {spread != null ? fmtPx(spread) : "—"}
            {spreadPct != null && ` (${spreadPct.toFixed(3)}%)`}
          </span>
        </div>

        <div>
          {bidRows.map((r, i) => (
            <Row key={`b${i}`} level={r.level} total={r.total} maxTotal={maxTotal} side="bid" />
          ))}
          {bidRows.length === 0 && <BookSkeleton />}
        </div>
      </div>
    </div>
  );
}

function BookSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[18px] animate-pulse rounded bg-white/[0.03]" />
      ))}
    </div>
  );
}
