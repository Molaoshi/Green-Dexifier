import { NextResponse } from "next/server";
import { getSwapSummary } from "@/lib/server/swaps";

export const dynamic = "force-dynamic";

// GET /api/swaps/summary — real headline numbers for the explorer home.
export async function GET() {
  try {
    return NextResponse.json(await getSwapSummary());
  } catch (error) {
    console.error("swap summary failed:", error);
    return NextResponse.json({ error: "Failed to load summary" }, { status: 500 });
  }
}
