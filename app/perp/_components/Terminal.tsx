"use client";

// Terminal shell — tri-column pro layout:
//   left: markets · center: ticker + chart + account · right: ticket + book/tape
// Collapses to a stacked, tabbed single column on mobile.

import React, { useState } from "react";
import { PerpProvider } from "../_lib/store";
import { IS_TESTNET } from "../_lib/config";
import MarketList from "./MarketList";
import MarketHeader from "./MarketHeader";
import PriceChart from "./PriceChart";
import OrderBook from "./OrderBook";
import TradesTape from "./TradesTape";
import OrderTicket from "./OrderTicket";
import AccountPanel from "./AccountPanel";
import "../perp.css";

function TerminalBody() {
  const [mobileTab, setMobileTab] = useState<"chart" | "book" | "trade">("chart");
  const [rightTab, setRightTab] = useState<"book" | "trades">("book");

  return (
    <div className="perp-root min-h-screen bg-abyss pt-20 text-paragraph sm:pt-24">
      <div className="mx-auto max-w-[1720px] px-2 pb-6 sm:px-3">
        {IS_TESTNET && (
          <div className="mb-2 rounded-lg border border-amber-400/25 bg-amber-400/[0.06] px-3 py-1.5 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300/90">
            Testnet — mock funds, real mechanics
          </div>
        )}

        {/* Desktop grid */}
        <div className="hidden gap-2 lg:grid lg:grid-cols-[272px_minmax(0,1fr)_352px]">
          {/* Markets */}
          <div className="perp-panel perp-scroll h-[calc(100vh-130px)] overflow-y-auto">
            <MarketList />
          </div>

          {/* Center column */}
          <div className="flex h-[calc(100vh-130px)] min-w-0 flex-col gap-2">
            <MarketHeader />
            <div className="perp-panel min-h-0 flex-1">
              <PriceChart />
            </div>
            <div className="perp-panel h-[300px] shrink-0 overflow-hidden">
              <AccountPanel />
            </div>
          </div>

          {/* Right column */}
          <div className="flex h-[calc(100vh-130px)] min-w-0 flex-col gap-2">
            <OrderTicket />
            <div className="perp-panel min-h-0 flex-1 overflow-hidden">
              <div className="perp-panel-head">
                <button
                  className={rightTab === "book" ? "text-primary" : "hover:text-white/80"}
                  onClick={() => setRightTab("book")}
                >
                  Order Book
                </button>
                <span className="text-white/15">/</span>
                <button
                  className={rightTab === "trades" ? "text-primary" : "hover:text-white/80"}
                  onClick={() => setRightTab("trades")}
                >
                  Trades
                </button>
              </div>
              {rightTab === "book" ? <OrderBook /> : <TradesTape />}
            </div>
          </div>
        </div>

        {/* Mobile stack */}
        <div className="flex flex-col gap-2 lg:hidden">
          <MarketHeader />
          <div className="perp-seg">
            <button className={mobileTab === "chart" ? "active" : ""} onClick={() => setMobileTab("chart")}>
              Chart
            </button>
            <button className={mobileTab === "book" ? "active" : ""} onClick={() => setMobileTab("book")}>
              Book
            </button>
            <button className={mobileTab === "trade" ? "active" : ""} onClick={() => setMobileTab("trade")}>
              Trade
            </button>
          </div>
          {mobileTab === "chart" && (
            <div className="perp-panel h-[380px]">
              <PriceChart />
            </div>
          )}
          {mobileTab === "book" && (
            <div className="perp-panel h-[380px] overflow-hidden">
              <OrderBook />
            </div>
          )}
          {mobileTab === "trade" && <OrderTicket />}
          <div className="perp-panel max-h-[300px] overflow-y-auto">
            <MarketList />
          </div>
          <div className="perp-panel overflow-hidden">
            <AccountPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Terminal() {
  return (
    <PerpProvider>
      <TerminalBody />
    </PerpProvider>
  );
}
