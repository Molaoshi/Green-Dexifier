"use client";

// Singleton Hyperliquid clients — one HTTP info client + one WS subscription
// client shared by the whole terminal (subscriptions come and go per market).

import * as hl from "@nktkas/hyperliquid";
import type { AbstractWallet } from "@nktkas/hyperliquid/signing";
import { Wallet } from "ethers";
import { IS_TESTNET } from "../config";

let httpTransport: hl.HttpTransport | null = null;
let infoClient: hl.InfoClient | null = null;
let wsTransport: hl.WebSocketTransport | null = null;
let subsClient: hl.SubscriptionClient | null = null;

export function getInfoClient(): hl.InfoClient {
  if (!infoClient) {
    httpTransport = new hl.HttpTransport({ isTestnet: IS_TESTNET });
    infoClient = new hl.InfoClient({ transport: httpTransport });
  }
  return infoClient;
}

export function getSubsClient(): hl.SubscriptionClient {
  if (!subsClient) {
    wsTransport = new hl.WebSocketTransport({ isTestnet: IS_TESTNET });
    subsClient = new hl.SubscriptionClient({ transport: wsTransport });
  }
  return subsClient;
}

/** ExchangeClient bound to the user's own signer (approvals only). */
export function getUserExchangeClient(signer: AbstractWallet) {
  return new hl.ExchangeClient({
    wallet: signer,
    transport: new hl.HttpTransport({ isTestnet: IS_TESTNET }),
    signatureChainId: "0xa4b1", // Arbitrum — HL's user-signed action domain (off-chain sig only)
  });
}

/** ExchangeClient bound to the agent (API) wallet — signs orders silently. */
export function getAgentExchangeClient(agentPrivateKey: `0x${string}`) {
  return new hl.ExchangeClient({
    wallet: new Wallet(agentPrivateKey) as unknown as AbstractWallet,
    transport: new hl.HttpTransport({ isTestnet: IS_TESTNET }),
  });
}
