import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Pagination({
  page,
  total,
  pageSize,
  basePath,
  extraQuery,
}: {
  page: number;
  total: number;
  pageSize: number;
  basePath: string;
  extraQuery?: Record<string, string>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams({ ...extraQuery, page: String(p) });
    return `${basePath}?${params.toString()}`;
  };

  // Compact page window around the current page.
  const windowSize = 5;
  const start = Math.max(0, Math.min(page - Math.floor(windowSize / 2), pages - windowSize));
  const windowPages = Array.from(
    { length: Math.min(windowSize, pages) },
    (_, i) => start + i,
  );

  const btn =
    "flex h-9 min-w-9 items-center justify-center rounded-lg border border-white/10 px-2 text-sm transition-colors";

  return (
    <div className="mt-6 flex items-center justify-center gap-1.5">
      <Link
        href={href(Math.max(0, page - 1))}
        aria-disabled={page === 0}
        className={cn(btn, page === 0 && "pointer-events-none opacity-30")}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
      {start > 0 && <span className="px-1 text-neutral-600">…</span>}
      {windowPages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          className={cn(
            btn,
            p === page
              ? "border-primary/50 bg-primary/15 text-primary"
              : "text-neutral-400 hover:border-primary/30 hover:text-white",
          )}
        >
          {p + 1}
        </Link>
      ))}
      {start + windowSize < pages && <span className="px-1 text-neutral-600">…</span>}
      <Link
        href={href(Math.min(pages - 1, page + 1))}
        aria-disabled={page >= pages - 1}
        className={cn(btn, page >= pages - 1 && "pointer-events-none opacity-30")}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
