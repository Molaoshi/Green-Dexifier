"use client";

import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { usePerp } from "../_lib/store";
import { cancelOrder, placeOrder } from "../_lib/hl/trading";
import { fmtDateTime, fmtPct, fmtPx, fmtSigned, fmtSz, fmtUsd } from "../_lib/format";

type Tab = "positions" | "orders" | "fills";

export default function AccountPanel() {
  const {
    user,
    agent,
    accountSummary,
    positions,
    openOrders,
    fills,
    markets,
    mids,
    refreshAccount,
    selectCoin,
  } = usePerp();
  const [tab, setTab] = useState<Tab>("positions");
  const [busyId, setBusyId] = useState<string | null>(null);

  const counts = {
    positions: positions.length,
    orders: openOrders.length,
    fills: fills.length,
  };

  const doCancel = async (assetId: number, oid: number) => {
    if (!agent) return;
    setBusyId(`c${oid}`);
    const res = await cancelOrder(agent, assetId, oid);
    if (res.ok) {
      toast.success("Order cancelled");
      refreshAccount();
    } else toast.error(res.error ?? "Cancel failed");
    setBusyId(null);
  };

  const closePosition = async (coin: string, size: number) => {
    if (!agent) return;
    const m = markets.find((x) => x.coin === coin);
    const mid = mids[coin];
    if (!m || !mid) return;
    setBusyId(`x${coin}`);
    const res = await placeOrder(agent, {
      assetId: m.assetId,
      szDecimals: m.szDecimals,
      isBuy: size < 0,
      size: Math.abs(size),
      reduceOnly: true,
      market: { midPx: mid },
    });
    if (res.ok) {
      toast.success(`Closed ${coin} position`);
      refreshAccount();
    } else toast.error(res.error ?? "Close failed");
    setBusyId(null);
  };

  const summary = useMemo(
    () => [
      { label: "Account Value", value: `$${fmtUsd(accountSummary?.accountValue)}` },
      { label: "Available", value: `$${fmtUsd(accountSummary?.available)}` },
      { label: "Margin Used", value: `$${fmtUsd(accountSummary?.marginUsed)}` },
    ],
    [accountSummary],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="perp-panel-head !gap-3">
        {(["positions", "orders", "fills"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`capitalize transition-colors ${
              tab === t ? "text-primary" : "hover:text-white/80"
            }`}
          >
            {t}
            {counts[t] > 0 && <span className="num ml-1 text-[10px]">({counts[t]})</span>}
          </button>
        ))}
        <div className="num ml-auto hidden gap-4 text-[10px] normal-case tracking-normal text-[var(--meta)] md:flex">
          {summary.map((s) => (
            <span key={s.label}>
              {s.label} <span className="font-bold text-white/85">{s.value}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="perp-scroll min-h-0 flex-1 overflow-y-auto">
        {!user ? (
          <EmptyState text="Connect a wallet to see your account" />
        ) : tab === "positions" ? (
          positions.length === 0 ? (
            <EmptyState text="No open positions" />
          ) : (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[var(--line)] text-left text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--meta)]">
                  <Th>Coin</Th>
                  <Th className="text-right">Size</Th>
                  <Th className="text-right">Entry</Th>
                  <Th className="text-right">Mark</Th>
                  <Th className="text-right">Liq.</Th>
                  <Th className="text-right">uPnL</Th>
                  <Th className="text-right">ROE</Th>
                  <Th className="text-right">Lev</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => {
                  const mark = mids[p.coin] ?? p.markPx;
                  const long = p.size > 0;
                  return (
                    <tr key={p.coin} className="border-b border-[var(--line)]/50 hover:bg-white/[0.02]">
                      <Td>
                        <button onClick={() => selectCoin(p.coin)} className="font-bold text-white/90 hover:text-primary">
                          {p.coin}
                        </button>
                        <span className={`ml-1.5 rounded px-1 text-[9px] font-bold ${long ? "bg-primary/10 text-primary" : "bg-[var(--down)]/10 text-[var(--down)]"}`}>
                          {long ? "LONG" : "SHORT"}
                        </span>
                      </Td>
                      <Td className="num text-right">{fmtSz(Math.abs(p.size), 4)}</Td>
                      <Td className="num text-right">{fmtPx(p.entryPx)}</Td>
                      <Td className="num text-right">{fmtPx(mark)}</Td>
                      <Td className="num text-right text-[var(--meta)]">{p.liquidationPx ? fmtPx(p.liquidationPx) : "—"}</Td>
                      <Td className={`num text-right font-bold ${p.unrealizedPnl >= 0 ? "text-[var(--up)]" : "text-[var(--down)]"}`}>
                        {fmtSigned(p.unrealizedPnl)}
                      </Td>
                      <Td className={`num text-right ${p.returnOnEquity >= 0 ? "text-[var(--up)]" : "text-[var(--down)]"}`}>
                        {fmtPct(p.returnOnEquity, 1)}
                      </Td>
                      <Td className="num text-right text-[var(--meta)]">{p.leverage}×</Td>
                      <Td className="text-right">
                        <button
                          onClick={() => closePosition(p.coin, p.size)}
                          disabled={!agent || busyId === `x${p.coin}`}
                          className="rounded border border-white/15 px-2 py-0.5 text-[10px] font-bold text-white/70 transition-colors hover:border-[var(--down)] hover:text-[var(--down)] disabled:opacity-40"
                        >
                          {busyId === `x${p.coin}` ? "…" : "Close"}
                        </button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : tab === "orders" ? (
          openOrders.length === 0 ? (
            <EmptyState text="No open orders" />
          ) : (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[var(--line)] text-left text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--meta)]">
                  <Th>Time</Th>
                  <Th>Coin</Th>
                  <Th>Type</Th>
                  <Th className="text-right">Side</Th>
                  <Th className="text-right">Price</Th>
                  <Th className="text-right">Size</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {openOrders.map((o) => (
                  <tr key={o.oid} className="border-b border-[var(--line)]/50 hover:bg-white/[0.02]">
                    <Td className="num text-[var(--meta)]">{fmtDateTime(o.time)}</Td>
                    <Td className="font-bold text-white/90">{o.coin}</Td>
                    <Td className="text-[var(--meta)]">
                      {o.isTrigger ? `Trigger ${o.triggerPx ? `@ ${fmtPx(o.triggerPx)}` : ""}` : o.orderType}
                      {o.reduceOnly && <span className="ml-1 text-[9px]">RO</span>}
                    </Td>
                    <Td className={`num text-right font-bold ${o.side === "buy" ? "text-[var(--up)]" : "text-[var(--down)]"}`}>
                      {o.side.toUpperCase()}
                    </Td>
                    <Td className="num text-right">{fmtPx(o.limitPx)}</Td>
                    <Td className="num text-right">{fmtSz(o.sz, 4)}</Td>
                    <Td className="text-right">
                      <button
                        onClick={() => doCancel(o.assetId, o.oid)}
                        disabled={!agent || busyId === `c${o.oid}`}
                        className="rounded border border-white/15 px-2 py-0.5 text-[10px] font-bold text-white/70 transition-colors hover:border-[var(--down)] hover:text-[var(--down)] disabled:opacity-40"
                      >
                        {busyId === `c${o.oid}` ? "…" : "Cancel"}
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : fills.length === 0 ? (
          <EmptyState text="No trades yet" />
        ) : (
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[var(--line)] text-left text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--meta)]">
                <Th>Time</Th>
                <Th>Coin</Th>
                <Th>Dir</Th>
                <Th className="text-right">Price</Th>
                <Th className="text-right">Size</Th>
                <Th className="text-right">Closed PnL</Th>
                <Th className="text-right">Fee</Th>
              </tr>
            </thead>
            <tbody>
              {fills.slice(0, 50).map((f, i) => (
                <tr key={`${f.time}-${i}`} className="border-b border-[var(--line)]/50 hover:bg-white/[0.02]">
                  <Td className="num text-[var(--meta)]">{fmtDateTime(f.time)}</Td>
                  <Td className="font-bold text-white/90">{f.coin}</Td>
                  <Td className={`${f.side === "buy" ? "text-[var(--up)]" : "text-[var(--down)]"}`}>{f.dir}</Td>
                  <Td className="num text-right">{fmtPx(f.px)}</Td>
                  <Td className="num text-right">{fmtSz(f.sz, 4)}</Td>
                  <Td className={`num text-right ${f.closedPnl >= 0 ? "text-[var(--up)]" : "text-[var(--down)]"}`}>
                    {fmtSigned(f.closedPnl)}
                  </Td>
                  <Td className="num text-right text-[var(--meta)]">{fmtUsd(f.fee, 4)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-2.5 py-1.5 font-bold ${className}`}>{children}</th>;
}

function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-2.5 py-[7px] ${className}`}>{children}</td>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-[80px] items-center justify-center">
      <p className="text-[11px] text-[var(--meta)]">{text}</p>
    </div>
  );
}
