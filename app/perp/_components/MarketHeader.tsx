"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePerp } from "../_lib/store";
import { fmtCompact, fmtFunding, fmtPct, fmtPx } from "../_lib/format";

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="flex min-w-[72px] flex-col gap-0.5">
      <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--meta)]">
        {label}
      </span>
      <span
        className={`num text-[12px] font-semibold ${
          tone === "up" ? "text-[var(--up)]" : tone === "down" ? "text-[var(--down)]" : "text-white/90"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function MarketHeader() {
  const { selected } = usePerp();
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevPx = useRef<number | null>(null);

  const px = selected?.midPx ?? selected?.markPx ?? null;

  useEffect(() => {
    if (px == null || prevPx.current == null) {
      prevPx.current = px;
      return;
    }
    if (px > prevPx.current) setFlash("up");
    else if (px < prevPx.current) setFlash("down");
    prevPx.current = px;
    const t = setTimeout(() => setFlash(null), 500);
    return () => clearTimeout(t);
  }, [px]);

  if (!selected) {
    return <div className="perp-panel h-[52px] animate-pulse" />;
  }

  const change = selected.change24h;
  const up = (change ?? 0) >= 0;

  return (
    <div className="perp-panel flex flex-wrap items-center gap-x-5 gap-y-2 px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-[13px] font-black text-primary">
          {selected.coin.slice(0, 3)}
        </div>
        <div>
          <div className="text-[14px] font-extrabold leading-tight text-white">
            {selected.coin}
            <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--meta)]">
              Perp
            </span>
          </div>
          <div
            className={`num text-[15px] font-bold leading-tight ${
              flash === "up"
                ? "perp-flash-up"
                : flash === "down"
                  ? "perp-flash-down"
                  : "text-white/90"
            }`}
          >
            {fmtPx(px)}
          </div>
        </div>
      </div>

      <div className="h-8 w-px bg-[var(--line)]" />

      <Stat label="24h Change" value={fmtPct(change)} tone={up ? "up" : "down"} />
      <Stat label="24h Volume" value={`$${fmtCompact(selected.volume24h)}`} />
      <Stat
        label="Funding"
        value={fmtFunding(selected.funding)}
        tone={(selected.funding ?? 0) >= 0 ? "up" : "down"}
      />
      <Stat
        label="Open Interest"
        value={`$${fmtCompact((selected.openInterest ?? 0) * (px ?? 0))}`}
      />
      <Stat label="Oracle" value={fmtPx(selected.oraclePx)} />
      <div className="ml-auto hidden items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.06] px-2.5 py-1 md:flex">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
        </span>
        <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-primary">
          Live
        </span>
      </div>
    </div>
  );
}
