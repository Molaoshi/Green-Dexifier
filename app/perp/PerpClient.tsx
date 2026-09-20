"use client";

// The terminal is fully client-side (WebSocket + wallet) — load it only in
// the browser. ssr:false inside a client component keeps Next happy.

import dynamic from "next/dynamic";

const Terminal = dynamic(() => import("./_components/Terminal"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[70vh] items-center justify-center pt-24">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
          Loading terminal
        </p>
      </div>
    </div>
  ),
});

export default function PerpClient() {
  return <Terminal />;
}
