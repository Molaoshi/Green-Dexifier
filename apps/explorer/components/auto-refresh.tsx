"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Re-fetch server data while a swap is still running so the page updates
// without a manual reload.
export default function AutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
