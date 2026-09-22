import { NextRequest, NextResponse } from "next/server";
import { exolixPost, ExolixError } from "@/lib/server/exolix";
import { recordSwap, validateSwapInput } from "@/lib/server/swaps";

// POST /api/exolix/transactions  — create a swap transaction
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await exolixPost("/transactions", body);
    // Record for the explorer — best-effort: never let tracking break a swap.
    try {
      const d = data as Record<string, any>;
      const input = validateSwapInput({
        provider: "exolix",
        externalId: d.id,
        fromChain: d.coinFrom?.network ?? body.networkFrom,
        fromToken: d.coinFrom?.coinCode ?? body.coinFrom,
        fromAmount: String(d.amount ?? body.amount ?? ""),
        toChain: d.coinTo?.network ?? body.networkTo,
        toToken: d.coinTo?.coinCode ?? body.coinTo,
        depositAddress: d.depositAddress,
        recipientAddress: d.withdrawalAddress ?? body.withdrawalAddress,
        extra: d,
      });
      if (input) await recordSwap(input);
    } catch (trackError) {
      console.debug("exolix swap tracking failed:", trackError);
    }
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ExolixError) {
      return NextResponse.json(error.data, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
