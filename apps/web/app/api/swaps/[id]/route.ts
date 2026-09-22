import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refreshSwap } from "@/lib/server/swap-status";

export const dynamic = "force-dynamic";

// GET /api/swaps/[externalId]?provider=rango — swap detail for the explorer.
// The path id is the provider's own id (Rango requestId, Exolix tx id,
// Chainflip swap id); ?provider= disambiguates the rare cross-provider
// collision. Non-final swaps are refreshed before responding.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const provider = req.nextUrl.searchParams.get("provider") ?? undefined;
    if (!id || id.length > 256) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    let swap = await prisma.swap.findFirst({
      where: { externalId: id, ...(provider ? { provider } : {}) },
      orderBy: { createdAt: "desc" },
    });
    if (!swap) {
      return NextResponse.json({ message: "Transaction not found!" }, { status: 404 });
    }
    if (swap.status === "running" && Date.now() - swap.updatedAt.getTime() > 60_000) {
      await refreshSwap(swap);
      swap = await prisma.swap.findUnique({ where: { id: swap.id } });
    }
    return NextResponse.json({ detailedTransaction: swap });
  } catch (error) {
    console.error("swap detail failed:", error);
    return NextResponse.json({ error: "Failed to fetch swap" }, { status: 500 });
  }
}
