"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Real blockchain logo from Rango meta when available, deterministic letter
// avatar as fallback. Never a broken image.
export default function ChainLogo({
  name,
  logo,
  size = "md",
}: {
  name: string;
  logo?: string | null;
  size?: "sm" | "md";
}) {
  const [failed, setFailed] = useState(false);
  const dim = size === "sm" ? "h-5 w-5 text-[8px]" : "h-7 w-7 text-[10px]";

  if (!logo || failed) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 font-bold text-primary",
          dim,
        )}
      >
        {(name || "?").slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("shrink-0 rounded-full", dim)}
    />
  );
}
