"use client";

// Trading operations: agent-wallet session management, builder-fee consent,
// order placement with Dexifier's builder code attached.

import { Wallet } from "ethers";
import { formatPrice, formatSize } from "@nktkas/hyperliquid/utils";
import {
  getAgentExchangeClient,
  getUserExchangeClient,
} from "./clients";
import {
  BUILDER_ADDRESS,
  BUILDER_ENABLED,
  BUILDER_FEE_TENTHS,
  BUILDER_MAX_FEE_RATE,
  MARKET_ORDER_SLIPPAGE,
  PERP_NETWORK,
} from "../config";
import type { AbstractWallet } from "@nktkas/hyperliquid/signing";

// ---------- Agent wallet (session key) ----------

export interface AgentWallet {
  address: `0x${string}`;
  privateKey: `0x${string}`;
}

const agentKey = (user: string) =>
  `perp:${PERP_NETWORK}:agent:${user.toLowerCase()}`;

export function loadAgent(user: string): AgentWallet | null {
  try {
    const raw = localStorage.getItem(agentKey(user));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AgentWallet;
    return parsed.address && parsed.privateKey ? parsed : null;
  } catch {
    return null;
  }
}

export function createAgent(user: string): AgentWallet {
  const w = Wallet.createRandom();
  const agent: AgentWallet = {
    address: w.address as `0x${string}`,
    privateKey: w.privateKey as `0x${string}`,
  };
  localStorage.setItem(agentKey(user), JSON.stringify(agent));
  return agent;
}

/** One-time user signature: authorize the agent to trade on their behalf. */
export async function approveAgent(
  userSigner: AbstractWallet,
  agent: AgentWallet,
): Promise<void> {
  const client = getUserExchangeClient(userSigner);
  await client.approveAgent({ agentAddress: agent.address, agentName: "dexifier" });
}

// ---------- Builder fee consent ----------

/** One-time user signature: approve Dexifier's max builder fee (revocable). */
export async function approveBuilderFee(userSigner: AbstractWallet): Promise<void> {
  const client = getUserExchangeClient(userSigner);
  await client.approveBuilderFee({
    builder: BUILDER_ADDRESS,
    maxFeeRate: BUILDER_MAX_FEE_RATE,
  });
}

// ---------- Orders ----------

export interface OrderIntent {
  assetId: number;
  szDecimals: number;
  isBuy: boolean;
  size: number; // coin units
  reduceOnly: boolean;
  // Exactly one of market/limit:
  market?: { midPx: number };
  limit?: { price: number; tif: "Gtc" | "Ioc" | "Alo" };
  // Optional attached TP/SL (trigger prices):
  takeProfit?: number;
  stopLoss?: number;
}

interface OrderWire {
  a: number;
  b: boolean;
  p: string;
  s: string;
  r: boolean;
  t:
    | { limit: { tif: "Gtc" | "Ioc" | "Alo" } }
    | { trigger: { isMarket: boolean; triggerPx: string; tpsl: "tp" | "sl" } };
}

export interface OrderResult {
  ok: boolean;
  builderAttached: boolean;
  error?: string;
}

function builderParam(): { b: `0x${string}`; f: number } | undefined {
  return BUILDER_ENABLED ? { b: BUILDER_ADDRESS, f: BUILDER_FEE_TENTHS } : undefined;
}

function extractError(response: unknown): string | null {
  const r = response as {
    status?: string;
    response?: { data?: { statuses?: ({ error?: string } | unknown)[] } };
  };
  if (r?.status === "err") return String((r as { response?: unknown }).response ?? "Order failed");
  const statuses = r?.response?.data?.statuses ?? [];
  for (const s of statuses) {
    if (s && typeof s === "object" && "error" in s && (s as { error?: string }).error) {
      return String((s as { error: string }).error);
    }
  }
  return null;
}

async function sendOrders(
  agent: AgentWallet,
  wires: OrderWire[],
  withBuilder: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const client = getAgentExchangeClient(agent.privateKey);
  const res = await client.order({
    orders: wires,
    grouping: "na",
    builder: withBuilder ? builderParam() : undefined,
  });
  const err = extractError(res);
  return err ? { ok: false, error: err } : { ok: true };
}

/**
 * Place an order (entry + optional TP/SL triggers).
 * Builder fee is attached to every order; if the venue rejects it (e.g. the
 * user hasn't approved the builder yet), retries once without it so trading
 * never hard-blocks on a consent edge case.
 */
export async function placeOrder(
  agent: AgentWallet,
  intent: OrderIntent,
): Promise<OrderResult> {
  const { assetId, szDecimals, isBuy, size } = intent;
  const s = formatSize(size, szDecimals);

  const entry: OrderWire = intent.market
    ? {
        a: assetId,
        b: isBuy,
        p: formatPrice(
          intent.market.midPx * (isBuy ? 1 + MARKET_ORDER_SLIPPAGE : 1 - MARKET_ORDER_SLIPPAGE),
          szDecimals,
        ),
        s,
        r: intent.reduceOnly,
        t: { limit: { tif: "Ioc" } },
      }
    : {
        a: assetId,
        b: isBuy,
        p: formatPrice(intent.limit!.price, szDecimals),
        s,
        r: intent.reduceOnly,
        t: { limit: { tif: intent.limit!.tif } },
      };

  const wires: OrderWire[] = [entry];

  const closeSide = !isBuy;
  if (intent.takeProfit) {
    wires.push({
      a: assetId,
      b: closeSide,
      p: formatPrice(intent.takeProfit, szDecimals),
      s,
      r: true,
      t: { trigger: { isMarket: true, triggerPx: formatPrice(intent.takeProfit, szDecimals), tpsl: "tp" } },
    });
  }
  if (intent.stopLoss) {
    wires.push({
      a: assetId,
      b: closeSide,
      p: formatPrice(intent.stopLoss, szDecimals),
      s,
      r: true,
      t: { trigger: { isMarket: true, triggerPx: formatPrice(intent.stopLoss, szDecimals), tpsl: "sl" } },
    });
  }

  const first = await sendOrders(agent, wires, BUILDER_ENABLED);
  if (first.ok) return { ok: true, builderAttached: BUILDER_ENABLED };

  if (first.error && /builder/i.test(first.error)) {
    const retry = await sendOrders(agent, wires, false);
    if (retry.ok) return { ok: true, builderAttached: false };
    return { ok: false, builderAttached: false, error: retry.error };
  }
  return { ok: false, builderAttached: BUILDER_ENABLED, error: first.error };
}

export async function cancelOrder(
  agent: AgentWallet,
  assetId: number,
  oid: number,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = getAgentExchangeClient(agent.privateKey);
    const res = await client.cancel({ cancels: [{ a: assetId, o: oid }] });
    const err = extractError(res);
    return err ? { ok: false, error: err } : { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Cancel failed" };
  }
}

export async function setLeverage(
  agent: AgentWallet,
  assetId: number,
  leverage: number,
  isCross = true,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = getAgentExchangeClient(agent.privateKey);
    await client.updateLeverage({ asset: assetId, isCross, leverage });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Leverage update failed" };
  }
}
