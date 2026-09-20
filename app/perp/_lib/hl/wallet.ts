"use client";

// Bridge between Dexifier's Rango wallet stack and Hyperliquid.
// Discovers the connected EVM wallet from the widget state and produces an
// ethers v6 signer — which the HL SDK accepts natively for EIP-712 signing.

import { useMemo } from "react";
import { useWidget, useWallets } from "@rango-dev/widget-embedded";
import { BrowserProvider, JsonRpcSigner, type Eip1193Provider } from "ethers";

export interface ConnectedEvm {
  address: `0x${string}`;
  walletType: string;
}

/** First connected wallet that has an EVM account, or null. */
export function useEvmWallet(): ConnectedEvm | null {
  const { wallets } = useWidget();
  return useMemo(() => {
    const details = wallets.details as {
      address?: string;
      walletType?: string;
      namespace?: string;
    }[];
    const evm =
      details.find((d) => d.namespace?.toLowerCase() === "evm" && d.address?.startsWith("0x")) ??
      details.find((d) => d.address?.startsWith("0x"));
    if (!evm?.address || !evm.walletType) return null;
    return { address: evm.address as `0x${string}`, walletType: evm.walletType };
  }, [wallets.details]);
}

/** Raw injected provider for a connected wallet type (lazy — needs connect first). */
export function useRawProviders(): () => Record<string, unknown> {
  const { providers } = useWallets();
  return providers as () => Record<string, unknown>;
}

/**
 * ethers v6 signer for the connected wallet. The HL SDK accepts it directly:
 * JsonRpcSigner.signTypedData(domain, types, value) matches its ethers-v6
 * wallet interface. Signing is off-chain — no chain switch required.
 */
export async function getEvmSigner(
  providers: () => Record<string, unknown>,
  walletType: string,
  address: string,
): Promise<JsonRpcSigner> {
  const instance = providers()[walletType];
  if (!instance) {
    throw new Error("Wallet provider not available — reconnect your wallet.");
  }
  const bp = new BrowserProvider(instance as Eip1193Provider);
  return await bp.getSigner(address);
}
