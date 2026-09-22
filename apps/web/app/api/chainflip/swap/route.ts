import { NextRequest, NextResponse } from "next/server";
import { chainflipGet, ChainflipBrokerError } from "@/lib/server/chainflip";
import { recordSwap, validateSwapInput } from "@/lib/server/swaps";

// GET /api/chainflip/swap — request a deposit address from the broker
export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const data = await chainflipGet("/swap", params);
    // Record for the explorer — best-effort: never let tracking break a swap.
    try {
      const d = data as Record<string, any>;
      const input = validateSwapInput({
        provider: "chainflip",
        externalId: d.id != null ? String(d.id) : String(d.channelId ?? ""),
        fromChain: params.sourceAsset ?? "",
        fromToken: params.sourceAsset ?? "",
        // amount arrives later via status (deposit.amount) — not known at
        // deposit-channel creation time
        fromAmount: String(params.amount ?? ""),
        toChain: params.destinationAsset ?? "",
        toToken: params.destinationAsset ?? "",
        depositAddress: d.address ?? d.depositAddress,
        recipientAddress: params.destinationAddress,
        extra: { request: params, response: d },
      });
      if (input) await recordSwap(input);
    } catch (trackError) {
      console.debug("chainflip swap tracking failed:", trackError);
    }
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ChainflipBrokerError) {
      return NextResponse.json(error.data, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to create swap" }, { status: 500 });
  }
}
