"use client";

import React from "react";
import { usePerp } from "../_lib/store";
import { fmtPx, fmtSz, fmtTime } from "../_lib/format";

export default function TradesTape() {
  const { tape } = usePerp();

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-3 border-b border-[var(--line)] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--meta)]">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Time</span>
      </div>
      <div className="perp-scroll min-h-0 flex-1 overflow-y-auto py-1">
        {tape.length === 0 && (
          <div className="space-y-1 p-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-[18px] animate-pulse rounded bg-white/[0.03]" />
            ))}
          </div>
        )}
        {tape.map((t, i) => (
          <div key={`${t.time}-${i}`} className="grid grid-cols-3 px-3 py-[2.5px] text-[11px]">
            <span className={`num ${t.side === "buy" ? "text-[var(--up)]" : "text-[var(--down)]"}`}>
              {fmtPx(t.px)}
            </span>
            <span className="num text-right text-white/75">{fmtSz(t.sz, 4)}</span>
            <span className="num text-right text-[var(--meta)]">{fmtTime(t.time)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
