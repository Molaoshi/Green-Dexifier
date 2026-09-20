// Perp terminal configuration — env-driven, testnet by default.
// Mainnet flip = set NEXT_PUBLIC_PERP_NETWORK=mainnet + the funded builder address.

export const PERP_NETWORK = (process.env.NEXT_PUBLIC_PERP_NETWORK ?? "testnet") as
  | "testnet"
  | "mainnet";
export const IS_TESTNET = PERP_NETWORK !== "mainnet";

// Dexifier builder address — receives the builder fee on every fill.
// Default below is a self-funded testnet builder; mainnet uses the env var.
export const BUILDER_ADDRESS = (
  process.env.NEXT_PUBLIC_PERP_BUILDER_ADDRESS ?? "0xD0c767012D5e3f0C4749d42a29F3CE302Ba543C5"
).toLowerCase() as `0x${string}`;

// Fee actually charged per order, in tenths of a basis point (30 = 3 bps = 0.03%).
export const BUILDER_FEE_TENTHS = Number(
  process.env.NEXT_PUBLIC_PERP_BUILDER_FEE_TENTHS ?? "30",
);

// Cap the user approves once (orders can charge at/below it without re-approval).
export const BUILDER_MAX_FEE_RATE =
  process.env.NEXT_PUBLIC_PERP_BUILDER_MAX_FEE_RATE ?? "0.1%";

export const BUILDER_ENABLED = /^0x[0-9a-f]{40}$/.test(BUILDER_ADDRESS);

// Slippage guard for "market" orders (they execute as aggressive IOC limits).
export const MARKET_ORDER_SLIPPAGE = 0.03; // 3%

export const CANDLE_INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
export type CandleInterval = (typeof CANDLE_INTERVALS)[number];
