import { cn } from "@/lib/utils";
import type { SwapStatus } from "@/lib/types";

const STYLES: Record<SwapStatus, { dot: string; text: string; label: string }> = {
  success: { dot: "bg-primary", text: "text-primary", label: "Success" },
  failed: { dot: "bg-error", text: "text-error", label: "Failed" },
  running: { dot: "bg-warning animate-pulse", text: "text-warning", label: "Running" },
};

export default function StatusBadge({ status }: { status: SwapStatus }) {
  const s = STYLES[status] ?? STYLES.running;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      <span className={cn("text-xs font-medium", s.text)}>{s.label}</span>
    </span>
  );
}
