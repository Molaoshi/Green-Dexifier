"use client";

import { useState } from "react";
import { Lock, Loader as LoaderIcon } from "lucide-react";

export default function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || checking) return;
    setChecking(true);
    setError(false);
    try {
      const res = await fetch("/api/stats/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onUnlock();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="glass-card w-full max-w-sm rounded-2xl p-8 text-center"
      >
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <h1 className="font-display text-lg font-semibold text-white">
          Statistics are restricted
        </h1>
        <p className="mt-1.5 text-xs text-neutral-500">
          Enter the team password to view routing analytics.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="mt-6 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-neutral-500 outline-none transition-colors focus:border-primary/50"
        />
        {error && (
          <p className="mt-2 text-left text-xs text-error">Wrong password — try again.</p>
        )}
        <button
          type="submit"
          disabled={checking || !password}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-black transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {checking && <LoaderIcon className="h-4 w-4 animate-spin" />}
          Unlock statistics
        </button>
      </form>
    </div>
  );
}
