import { NextRequest, NextResponse } from "next/server";
import { searchSwaps } from "@/lib/server/swaps";

export const dynamic = "force-dynamic";

// GET /api/swaps/search?query= — matches request/tx ids, on-chain hashes,
// and deposit/recipient addresses across all three providers.
export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("query") ?? "";
    const searchResult = await searchSwaps(query);
    return NextResponse.json({ searchResult });
  } catch (error) {
    console.error("swap search failed:", error);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
