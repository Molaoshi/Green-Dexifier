"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={submit} className="relative mx-auto w-full max-w-2xl">
      <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by request ID, transaction hash or wallet address"
        className="glass-card h-14 w-full rounded-2xl pl-13 pr-32 text-sm text-white placeholder:text-neutral-500 outline-none transition-all focus:border-primary/50 focus:shadow-neon sm:text-base"
        style={{ paddingLeft: "3.25rem" }}
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-xl bg-primary px-5 text-sm font-semibold text-black transition-colors hover:bg-primary-dark"
      >
        Search
      </button>
    </form>
  );
}
