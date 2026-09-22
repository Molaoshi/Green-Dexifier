import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <div className="tnum font-display text-7xl font-bold text-primary text-glow">404</div>
      <h1 className="mt-4 font-display text-xl font-semibold text-white">
        Nothing on-chain here
      </h1>
      <p className="mt-2 text-sm text-neutral-400">
        This page or swap doesn&apos;t exist. Check the request ID and try again.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-primary-dark"
      >
        Back to explorer
      </Link>
    </div>
  );
}
