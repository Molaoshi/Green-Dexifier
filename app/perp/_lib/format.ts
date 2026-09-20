// Display formatting for the terminal (numbers stay tabular via the mono font).

export function fmtPx(px: number | null | undefined): string {
  if (px == null || !Number.isFinite(px)) return "—";
  if (px >= 10000) return px.toLocaleString("en-US", { maximumFractionDigits: 1 });
  if (px >= 100) return px.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (px >= 1) return px.toLocaleString("en-US", { maximumFractionDigits: 4 });
  // sub-dollar: 5 significant figures
  return px.toPrecision(5).replace(/\.?0+$/, "");
}

export function fmtUsd(n: number | null | undefined, decimals = 2): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtSigned(n: number | null | undefined, decimals = 2): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = fmtUsd(Math.abs(n), decimals);
  return n >= 0 ? `+${abs}` : `-${abs}`;
}

export function fmtPct(fraction: number | null | undefined, decimals = 2): string {
  if (fraction == null || !Number.isFinite(fraction)) return "—";
  const v = fraction * 100;
  return `${v >= 0 ? "+" : ""}${v.toFixed(decimals)}%`;
}

export function fmtFunding(fraction: number | null | undefined): string {
  if (fraction == null || !Number.isFinite(fraction)) return "—";
  return `${(fraction * 100).toFixed(4)}%`;
}

export function fmtSz(sz: number | null | undefined, maxDecimals = 5): string {
  if (sz == null || !Number.isFinite(sz)) return "—";
  return sz.toLocaleString("en-US", { maximumFractionDigits: maxDecimals });
}

export function fmtCompact(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

export function fmtTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function fmtDateTime(ms: number): string {
  return new Date(ms).toLocaleString("en-GB", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
