"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, Search, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/transactions", label: "Swaps" },
  { href: "/statistics", label: "Statistics" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-abyss/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Image src="/logo.png" alt="Dexifier" width={30} height={30} className="rounded-md" />
          <span className="font-display text-lg font-semibold tracking-tight text-white">
            Dexifier
          </span>
          <span className="rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            Explorer
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition-colors",
                pathname === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-neutral-400 hover:text-white",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <form onSubmit={submit} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Request ID, tx hash or address"
              className="h-9 w-64 rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white placeholder:text-neutral-500 outline-none transition-colors focus:border-primary/50 focus:bg-white/[0.07]"
            />
          </form>
          <a
            href="https://www.dexifier.com"
            target="_blank"
            rel="noreferrer"
            className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-semibold text-black transition-colors hover:bg-primary-dark"
          >
            Launch App
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <button
          className="ml-auto rounded-lg p-2 text-neutral-300 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/5 bg-abyss/95 px-4 py-4 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm",
                  pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-neutral-300",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <form onSubmit={submit} className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Request ID, tx hash or address"
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-primary/50"
            />
          </form>
          <a
            href="https://www.dexifier.com"
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary text-sm font-semibold text-black"
          >
            Launch App
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      )}
    </header>
  );
}
