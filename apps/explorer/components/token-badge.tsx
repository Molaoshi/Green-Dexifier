import { cn } from "@/lib/utils";
import { prettyChain } from "@/lib/chains";

// Token identity without external images: a deterministic neon-tinted letter
// avatar + symbol and chain. No broken image icons, no fake logos.
const HUES = [160, 145, 175, 130, 190, 115, 200];

function hueFor(symbol: string): number {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) >>> 0;
  return HUES[h % HUES.length];
}

export default function TokenBadge({
  symbol,
  chain,
  size = "md",
}: {
  symbol: string;
  chain: string;
  size?: "sm" | "md";
}) {
  const hue = hueFor(symbol || "?");
  const dim = size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span
        className={cn("flex shrink-0 items-center justify-center rounded-full font-bold", dim)}
        style={{
          background: `hsla(${hue}, 85%, 55%, 0.14)`,
          color: `hsl(${hue}, 90%, 65%)`,
          border: `1px solid hsla(${hue}, 85%, 55%, 0.35)`,
        }}
      >
        {(symbol || "?").slice(0, 3).toUpperCase()}
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-semibold text-white">
          {(symbol || "").toUpperCase()}
        </span>
        <span className="block truncate text-[11px] text-neutral-500">
          {prettyChain(chain)}
        </span>
      </span>
    </span>
  );
}
