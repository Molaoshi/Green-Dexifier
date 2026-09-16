import { NextRequest, NextResponse } from "next/server";
import { sweepStaleSwaps } from "@/lib/server/swap-status";

export const maxDuration = 60;

// POST /api/swaps/sweep — daily cron: finalize swaps that are still
// "running" even if nobody has looked at them (lazy refresh covers reads,
// this covers everything else).
async function handler(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const swept = await sweepStaleSwaps();
    return NextResponse.json({ ok: true, swept });
  } catch (error) {
    console.error("swap sweep failed:", error);
    return NextResponse.json({ error: "Sweep failed" }, { status: 500 });
  }
}

export { handler as GET, handler as POST };
