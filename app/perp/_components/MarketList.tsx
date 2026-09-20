"use client";

import React, { useMemo, useState } from "react";
import { usePerp } from "../_lib/store";
import { fmtCompact, fmtPct, fmtPx } from "../_lib/format";
import { Search } from "lucide-react";

export default function MarketList() {
  const { markets, mids, marketsLoading, selected, selectCoin } = usePerp();
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const query = q.trim().toUpperCase();
    return markets
      .map((m) => {
        const mid = mids[m.coin] ?? m.midPx;
        const change = m.prevDayPx && mid ? (mid - m.prevDayPx) / m.prevDayPx : m.change24h;
        return { ...m, px: mid, change };
      })
      .filter((m) => !query || m.coin.includes(query))
      .sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0));
  }, [markets, mids, q]);

  return (
    <div className="flex h-full flex-col">
      <div className="perp-panel-head">Markets</div>
      <div className="border-b border-[var(--line)] p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="perp-input !py-1.5 pl-7 text-xs"
          />
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 border-b border-[var(--line)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--meta)]">
        <span>Coin</span>
        <span className="text-right">Price</span>
        <span className="w-14 text-right">24h</span>
      </div>
      <div className="perp-scroll min-h-0 flex-1 overflow-y-auto">
        {marketsLoading && (
          <div className="space-y-1 p-2">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="h-7 animate-pulse rounded bg-white/[0.03]" />
            ))}
          </div>
        )}
        {!marketsLoading &&
          rows.map((m) => {
            const active = selected?.coin === m.coin;
            const up = (m.change ?? 0) >= 0;
            return (
              <button
                key={m.coin}
                onClick={() => selectCoin(m.coin)}
                className={`grid w-full grid-cols-[1fr_auto_auto] items-center gap-x-2 border-l-2 px-3 py-[7px] text-left transition-colors ${
                  active
                    ? "border-primary bg-primary/[0.07]"
                    : "border-transparent hover:bg-white/[0.03]"
                }`}
              >
                <span className="min-w-0">
                  <span className={`block truncate text-[13px] font-bold ${active ? "text-primary" : "text-white/90"}`}>
                    {m.coin}
                  </span>
                  <span className="num block text-[10px] text-[var(--meta)]">
                    {fmtCompact(m.volume24h)}
                  </span>
                </span>
                <span className="num text-right text-[12px] text-white/85">{fmtPx(m.px)}</span>
                <span
                  className={`num w-14 text-right text-[11px] font-bold ${
                    up ? "text-[var(--up)]" : "text-[var(--down)]"
                  }`}
                >
                  {fmtPct(m.change, 1)}
                </span>
              </button>
            );
          })}
        {!marketsLoading && rows.length === 0 && (
          <p className="p-4 text-center text-xs text-[var(--meta)]">No markets match</p>
        )}
      </div>
    </div>
  );
}
