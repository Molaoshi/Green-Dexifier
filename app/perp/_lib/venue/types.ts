// Venue-agnostic types — the adapter interface every perp venue normalizes to.
// Hyperliquid is the first adapter; Aster/Lighter plug into these same shapes later.

export type VenueId = "hyperliquid";

export interface VenueMarket {
  venue: VenueId;
  coin: string; // display symbol, e.g. "BTC"
  assetId: number; // venue-internal asset index used in orders
  szDecimals: number; // lot-size decimals (drives price tick rules too)
  maxLeverage: number;
  onlyIsolated: boolean;
  // Live context — refreshed from metaAndAssetCtxs + subscriptions
  markPx: number;
  oraclePx: number;
  midPx: number | null;
  prevDayPx: number | null;
  change24h: number | null; // fraction, e.g. 0.023 = +2.3%
  volume24h: number | null; // USD notional
  funding: number | null; // current funding rate (per interval)
  openInterest: number | null; // in coin units
}

export interface BookLevel {
  px: number;
  sz: number;
  n: number; // number of orders
}

export interface Tape {
  px: number;
  sz: number;
  side: "buy" | "sell";
  time: number;
}

export interface Candle {
  t: number; // open time, ms
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface Position {
  coin: string;
  assetId: number;
  size: number; // signed; negative = short
  entryPx: number;
  markPx: number;
  positionValue: number; // USD
  unrealizedPnl: number;
  returnOnEquity: number;
  leverage: number;
  isCross: boolean;
  liquidationPx: number | null;
  marginUsed: number;
}

export interface OpenOrder {
  oid: number;
  coin: string;
  assetId: number;
  side: "buy" | "sell";
  limitPx: number;
  sz: number;
  reduceOnly: boolean;
  isTrigger: boolean;
  triggerPx: number | null;
  orderType: string; // display label
  time: number;
}

export interface Fill {
  coin: string;
  px: number;
  sz: number;
  side: "buy" | "sell";
  time: number;
  closedPnl: number;
  fee: number;
  dir: string; // venue's direction label, e.g. "Open Long"
  hash: string;
}

export interface AccountSummary {
  accountValue: number;
  available: number; // withdrawable / free collateral
  marginUsed: number;
  totalNtlPos: number;
}
