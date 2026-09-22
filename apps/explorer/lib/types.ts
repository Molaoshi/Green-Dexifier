// Domain types for the Dexifier explorer. These are the explorer's own clean
// shapes — the rewrite no longer mimics Rango's scanner types.

export type SwapStatus = "running" | "success" | "failed";
export type Provider = "rango" | "exolix" | "chainflip";

// Raw row shape returned by dexifier.com/api/swaps/* (Railway Swap table).
export interface SwapRow {
  id: string;
  provider: Provider;
  externalId: string;
  status: "running" | "success" | "failed" | "refunded";
  fromChain: string;
  fromToken: string;
  fromAmount: string;
  toChain: string;
  toToken: string;
  toAmount: string | null;
  depositAddress: string | null;
  recipientAddress: string | null;
  depositHash: string | null;
  settleHash: string | null;
  feeUsd: number | null;
  extra: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface SwapListResponse {
  total: number;
  transactions: SwapRow[];
  offset: number;
}

export interface SwapSummary {
  totalTxCount: number;
  last24HoursTxCount: number;
  connectedWallets: number;
  dailyInterval: { day: string; count: number }[];
}

// Statistics page (Rango scanner via server proxy).
export interface DailySummaryPoint {
  count: number;
  date: string;
  uniqueWallets: number;
  volume: number;
  bucket: string;
}

export interface BlockchainMeta {
  name: string;
  displayName: string;
  logo: string;
  shortName: string;
}

export interface BlockchainValue {
  key: string;
  value: number;
}

export interface PathValue {
  key: { source: string; destination: string };
  value: number;
}

export interface TopListSummary {
  topDestinationByTxCount: BlockchainValue[];
  topDestinationByVolume: BlockchainValue[];
  topSourceByTxCount: BlockchainValue[];
  topSourceByVolume: BlockchainValue[];
  topPathsByTxCount: PathValue[];
  topPathsByVolume: PathValue[];
}

export type StatisticDays = 7 | 30 | 90;
export type BreakDownBy = "TOTAL" | "SOURCE" | "DESTINATION";

export const PROVIDER_TITLES: Record<string, string> = {
  rango: "Rango",
  exolix: "Exolix",
  chainflip: "Chainflip",
};

export const mapStatus = (s: SwapRow["status"]): SwapStatus =>
  s === "refunded" ? "failed" : s;
