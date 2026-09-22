import { redirect } from "next/navigation";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { searchSwaps } from "@/lib/swaps";
import SwapsTable from "@/components/swaps-table";

export const dynamic = "force-dynamic";

export const metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  if (!query) redirect("/");

  const results = await searchSwaps(query);

  // An exact request-ID hit goes straight to the swap.
  const exact = results.find((r) => r.externalId === query);
  if (exact) redirect(`/swap/${encodeURIComponent(exact.externalId)}`);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-white">Search results</h1>
      <p className="tnum mb-6 mt-1 break-all text-sm text-neutral-500">
        {results.length} match{results.length === 1 ? "" : "es"} for “{query}”
      </p>

      {results.length > 0 ? (
        <SwapsTable swaps={results} />
      ) : (
        <div className="glass-card flex flex-col items-center rounded-2xl px-6 py-16 text-center">
          <SearchX className="mb-4 h-10 w-10 text-neutral-600" />
          <p className="text-sm text-neutral-400">
            No swap matches this request ID, transaction hash or address.
          </p>
          <Link
            href="/"
            className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-primary-dark"
          >
            Back to home
          </Link>
        </div>
      )}
    </div>
  );
}
