import { NextRequest, NextResponse } from "next/server";
import {
  listSwaps,
  recordSwap,
  validateSwapInput,
  SWAPS_PAGE_SIZE,
} from "@/lib/server/swaps";
import { refreshSwap } from "@/lib/server/swap-status";

export const dynamic = "force-dynamic";

// GET /api/swaps?page=0&status=all — public swap feed for the explorer.
// Non-final Exolix/Chainflip swaps on the page are refreshed against their
// provider before responding (lazy freshness, no separate worker needed).
export async function GET(req: NextRequest) {
  try {
    const page = Number(req.nextUrl.searchParams.get("page") ?? 0) || 0;
    const status = req.nextUrl.searchParams.get("status") ?? undefined;
    let { total, transactions } = await listSwaps(page, status);

    const refreshable = transactions.filter(
      (s) =>
        s.status === "running" &&
        s.provider !== "rango" &&
        Date.now() - s.updatedAt.getTime() > 60_000,
    );
    if (refreshable.length > 0) {
      await Promise.allSettled(refreshable.slice(0, 5).map((s) => refreshSwap(s)));
      ({ total, transactions } = await listSwaps(page, status));
    }

    return NextResponse.json({ total, transactions, offset: SWAPS_PAGE_SIZE });
  } catch (error) {
    console.error("swaps list failed:", error);
    return NextResponse.json({ error: "Failed to list swaps" }, { status: 500 });
  }
}

// POST /api/swaps — record a swap at creation time. Used by the in-app
// Rango tracker (Exolix/Chainflip record server-side in their own routes).
// Input is strictly validated; junk is rejected, never stored.
export async function POST(req: NextRequest) {
  try {
    const input = validateSwapInput(await req.json());
    if (!input) {
      return NextResponse.json({ error: "Invalid swap record" }, { status: 400 });
    }
    const swap = await recordSwap(input);
    return NextResponse.json({ ok: true, id: swap.id });
  } catch (error) {
    console.error("swap record failed:", error);
    return NextResponse.json({ error: "Failed to record swap" }, { status: 500 });
  }
}
