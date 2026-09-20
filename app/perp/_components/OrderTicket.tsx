"use client";

import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { usePerp } from "../_lib/store";
import { placeOrder, setLeverage } from "../_lib/hl/trading";
import { BUILDER_FEE_TENTHS, BUILDER_MAX_FEE_RATE } from "../_lib/config";
import { fmtPx, fmtUsd } from "../_lib/format";
import WalletConnectModal from "@/app/_components/dexifier/WalletConnectModal";
import { BiSolidWallet } from "react-icons/bi";
import { ChevronDown, Zap } from "lucide-react";

export default function OrderTicket() {
  const {
    selected,
    user,
    agent,
    builderApproved,
    accountSummary,
    enableAgent,
    consentBuilder,
    setupBusy,
    refreshAccount,
  } = usePerp();

  const [isBuy, setIsBuy] = useState(true);
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPx, setLimitPx] = useState("");
  const [sizeStr, setSizeStr] = useState("");
  const [pct, setPct] = useState(0);
  const [leverage, setLev] = useState(5);
  const [showTpsl, setShowTpsl] = useState(false);
  const [tpStr, setTpStr] = useState("");
  const [slStr, setSlStr] = useState("");
  const [busy, setBusy] = useState(false);

  const px = selected?.midPx ?? selected?.markPx ?? null;
  const maxLev = Math.min(selected?.maxLeverage ?? 20, 50);
  const lev = Math.min(leverage, maxLev);
  const execPx = orderType === "limit" && limitPx ? parseFloat(limitPx) : px;

  const available = accountSummary?.available ?? 0;
  const maxSize = execPx ? (available * lev) / execPx : 0;
  const size = parseFloat(sizeStr) || 0;
  const orderValue = size * (execPx ?? 0);
  const marginNeeded = lev > 0 ? orderValue / lev : 0;
  const insufficient = size > 0 && marginNeeded > available;

  const applyPct = (p: number) => {
    setPct(p);
    if (maxSize > 0) {
      const raw = (maxSize * p) / 100;
      setSizeStr(raw > 0 ? raw.toPrecision(5).replace(/\.?0+$/, "") : "");
    }
  };

  const commitLeverage = async (v: number) => {
    setLev(v);
    if (agent && selected) {
      await setLeverage(agent, selected.assetId, v);
    }
  };

  const submit = async () => {
    if (!agent || !selected || !execPx || size <= 0) return;
    setBusy(true);
    try {
      const res = await placeOrder(agent, {
        assetId: selected.assetId,
        szDecimals: selected.szDecimals,
        isBuy,
        size,
        reduceOnly: false,
        market: orderType === "market" ? { midPx: execPx } : undefined,
        limit: orderType === "limit" ? { price: parseFloat(limitPx), tif: "Gtc" } : undefined,
        takeProfit: tpStr ? parseFloat(tpStr) : undefined,
        stopLoss: slStr ? parseFloat(slStr) : undefined,
      });
      if (res.ok) {
        toast.success(
          res.builderAttached
            ? `Order placed · ${(BUILDER_FEE_TENTHS / 1000).toFixed(2)}% Dexifier fee included`
            : "Order placed",
        );
        setSizeStr("");
        setPct(0);
        setTpStr("");
        setSlStr("");
        refreshAccount();
      } else {
        toast.error(res.error ?? "Order rejected");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Order failed");
    } finally {
      setBusy(false);
    }
  };

  const ready = !!user && !!agent && !!selected;

  return (
    <div className="perp-panel flex shrink-0 flex-col">
      <div className="perp-panel-head">Place Order</div>
      <div className="flex flex-col gap-2.5 p-3">
        {/* Side */}
        <div className="perp-seg">
          <button className={isBuy ? "active" : ""} onClick={() => setIsBuy(true)}>
            Buy / Long
          </button>
          <button className={!isBuy ? "active-red" : ""} onClick={() => setIsBuy(false)}>
            Sell / Short
          </button>
        </div>

        {/* Type */}
        <div className="perp-seg">
          <button className={orderType === "market" ? "active" : ""} onClick={() => setOrderType("market")}>
            Market
          </button>
          <button className={orderType === "limit" ? "active" : ""} onClick={() => setOrderType("limit")}>
            Limit
          </button>
        </div>

        {/* Limit price */}
        {orderType === "limit" && (
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--meta)]">
              Price
            </label>
            <input
              className="perp-input"
              inputMode="decimal"
              placeholder={px ? fmtPx(px) : "0.0"}
              value={limitPx}
              onChange={(e) => setLimitPx(e.target.value.replace(/[^0-9.]/g, ""))}
            />
          </div>
        )}

        {/* Size */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--meta)]">
              Size ({selected?.coin ?? "—"})
            </label>
            <span className="num text-[10px] text-[var(--meta)]">
              ≈ ${fmtUsd(orderValue)}
            </span>
          </div>
          <input
            className="perp-input"
            inputMode="decimal"
            placeholder="0.0"
            value={sizeStr}
            onChange={(e) => {
              setSizeStr(e.target.value.replace(/[^0-9.]/g, ""));
              setPct(0);
            }}
          />
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={pct}
            onChange={(e) => applyPct(Number(e.target.value))}
            className="perp-range mt-2"
            disabled={!user || maxSize <= 0}
          />
          <div className="num mt-0.5 flex justify-between text-[9px] text-[var(--meta)]">
            <span>0%</span>
            <span>Max {maxSize > 0 ? maxSize.toPrecision(4) : "—"}</span>
            <span>100%</span>
          </div>
        </div>

        {/* Leverage */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--meta)]">
              Leverage
            </label>
            <span className="num rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary">
              {lev}×
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={maxLev}
            step={1}
            value={lev}
            onChange={(e) => setLev(Number(e.target.value))}
            onPointerUp={(e) => commitLeverage(Number((e.target as HTMLInputElement).value))}
            onKeyUp={(e) => commitLeverage(Number((e.target as HTMLInputElement).value))}
            className="perp-range"
          />
          <div className="num mt-0.5 flex justify-between text-[9px] text-[var(--meta)]">
            <span>1×</span>
            <span>{maxLev}×</span>
          </div>
        </div>

        {/* TP/SL */}
        <button
          onClick={() => setShowTpsl(!showTpsl)}
          className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--meta)] transition-colors hover:text-white/80"
        >
          <span>Take profit / Stop loss</span>
          <ChevronDown className={`size-3.5 transition-transform ${showTpsl ? "rotate-180" : ""}`} />
        </button>
        {showTpsl && (
          <div className="grid grid-cols-2 gap-2">
            <input
              className="perp-input !text-[12px]"
              inputMode="decimal"
              placeholder="TP price"
              value={tpStr}
              onChange={(e) => setTpStr(e.target.value.replace(/[^0-9.]/g, ""))}
            />
            <input
              className="perp-input !text-[12px]"
              inputMode="decimal"
              placeholder="SL price"
              value={slStr}
              onChange={(e) => setSlStr(e.target.value.replace(/[^0-9.]/g, ""))}
            />
          </div>
        )}

        {/* Margin row */}
        <div className="num flex items-center justify-between border-t border-[var(--line)] pt-2 text-[11px] text-[var(--meta)]">
          <span>Margin ≈ ${fmtUsd(marginNeeded)}</span>
          <span className={insufficient ? "font-bold text-[var(--down)]" : ""}>
            Avail ${fmtUsd(user ? available : null)}
          </span>
        </div>

        {/* Action area — setup states gate the button */}
        {!user ? (
          <WalletConnectModal>
            <button className="btn-sheen flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[12px] font-extrabold uppercase tracking-[0.14em] text-black shadow-neon transition-all hover:brightness-110">
              <BiSolidWallet className="size-4" />
              Connect Wallet
            </button>
          </WalletConnectModal>
        ) : !agent ? (
          <button
            onClick={enableAgent}
            disabled={setupBusy === "agent"}
            className="btn-sheen flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[12px] font-extrabold uppercase tracking-[0.14em] text-black shadow-neon transition-all hover:brightness-110 disabled:opacity-60"
          >
            <Zap className="size-4" />
            {setupBusy === "agent" ? "Check your wallet…" : "Enable one-click trading"}
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={busy || !ready || size <= 0 || insufficient}
            className={`flex h-11 w-full items-center justify-center rounded-lg text-[12px] font-extrabold uppercase tracking-[0.14em] text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 ${
              isBuy ? "bg-primary shadow-neon" : "bg-[var(--down)]"
            }`}
          >
            {busy
              ? "Placing…"
              : insufficient
                ? "Insufficient margin"
                : `${isBuy ? "Buy" : "Sell"} ${selected?.coin ?? ""}`}
          </button>
        )}

        {user && !agent && (
          <p className="text-[10px] leading-relaxed text-[var(--meta)]">
            One signature creates a session key stored only in this browser — then trades sign
            silently. Your main wallet never leaves your control.
          </p>
        )}

        {/* Builder consent — transparent, non-blocking, on-chain */}
        {user && agent && !builderApproved && (
          <div className="rounded-lg border border-primary/20 bg-primary/[0.05] p-2.5">
            <p className="text-[10px] leading-relaxed text-white/70">
              Dexifier charges <span className="font-bold text-primary">0.03%</span> per trade via an
              on-chain builder code. Approve a max of {BUILDER_MAX_FEE_RATE} once — revocable
              anytime from your wallet.
            </p>
            <button
              onClick={consentBuilder}
              disabled={setupBusy === "builder"}
              className="mt-2 w-full rounded-md border border-primary/40 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary transition-colors hover:bg-primary hover:text-black disabled:opacity-60"
            >
              {setupBusy === "builder" ? "Check your wallet…" : "Approve on-chain"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
