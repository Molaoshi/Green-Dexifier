import Link from "next/link";
import { getSwaps } from "@/lib/swaps";
import { cn } from "@/lib/utils";
import SwapsTable from "@/components/swaps-table";
import Pagination from "@/components/pagination";

export const dynamic = "force-dynamic";

export const metadata = { title: "Swaps" };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "running", label: "Running" },
  { key: "success", label: "Success" },
  { key: "failed", label: "Failed" },
];

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { page: pageParam, status = "all" } = await searchParams;
  const page = Math.max(0, Number(pageParam ?? 0) || 0);
  const data = await getSwaps(page, status);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Swaps</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {data ? `${data.total.toLocaleString("en-US")} recorded swaps` : "Swap history"}
          </p>
        </div>
        <div className="flex gap-1.5 rounded-xl border border-white/10 bg-white/5 p-1">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={`/transactions?status=${f.key}`}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-sm transition-colors",
                status === f.key
                  ? "bg-primary font-medium text-black"
                  : "text-neutral-400 hover:text-white",
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <SwapsTable swaps={data?.transactions ?? []} />

      {data && (
        <Pagination
          page={page}
          total={data.total}
          pageSize={data.offset || 14}
          basePath="/transactions"
          extraQuery={status !== "all" ? { status } : undefined}
        />
      )}
    </div>
  );
}
