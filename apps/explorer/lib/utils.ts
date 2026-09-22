import { clsx, type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

// Tabular formatting helpers — every number on the site flows through these.
export const formatAmount = (value: string | number | null | undefined): string => {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "0";
  if (Math.abs(n) >= 1) {
    return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
  }
  // Small amounts: keep significant digits instead of vanishing to 0.000000
  return n.toPrecision(4).replace(/\.?0+$/, "");
};

export const formatUsd = (value: number | null | undefined): string => {
  if (value == null || !Number.isFinite(value)) return "—";
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatCount = (value: number | null | undefined): string =>
  (value ?? 0).toLocaleString("en-US");
