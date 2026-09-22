import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:px-6 md:flex-row">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Dexifier" width={24} height={24} className="rounded-md" />
          <span className="text-sm text-neutral-400">
            Dexifier Explorer — every swap, on the record.
          </span>
        </div>
        <div className="flex items-center gap-5 text-sm text-neutral-400">
          <Link href="/transactions" className="transition-colors hover:text-primary">
            Swaps
          </Link>
          <Link href="/statistics" className="transition-colors hover:text-primary">
            Statistics
          </Link>
          <a
            href="https://www.dexifier.com"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-primary"
          >
            dexifier.com
          </a>
        </div>
      </div>
    </footer>
  );
}
