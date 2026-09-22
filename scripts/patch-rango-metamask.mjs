// @rango-dev/provider-metamask identifies "MetaMask" by reading
// window.ethereum ONLY and checking isMetaMask against a blocklist that
// includes neither isTronLink nor isPhantom (verified still true upstream
// in 0.64.1, the latest stable at time of writing).
//
// Problem 1 — hijack: TronLink 4.x / Exodus install themselves at
// window.ethereum and spoof isMetaMask=true. Unpatched Rango accepts the
// impostor: the MetaMask tile looks fine but connects open the wrong
// wallet. Stage 1 below makes the check strict (reject isTronLink/
// isPhantom) and prefers the real MetaMask from window.ethereum.providers
// when another wallet owns the injection point.
//
// Problem 2 — shadowed MetaMask: some hijackers (Exodus) leave
// window.ethereum.providers EMPTY, so the real MetaMask is unreachable via
// the injection point and the strict check honestly reports
// "not_installed". Rango's own production app solves this via EIP-6963:
// it resolves MetaMask from the announceProvider bus by rdns
// "io.metamask" — a channel extensions cannot steal from each other. They
// have not backported this to the published widget, so Stage 2 grafts the
// same mechanism on: a warmed announcement registry resolves MetaMask
// first; the strict window.ethereum path remains as fallback for
// pre-EIP-6963 environments. The announced provider must still pass the
// strict check, so a malicious extension announcing a fake io.metamask
// with spoof flags is rejected.
//
// Runs from BOTH the postinstall hook (fresh installs) AND
// next.config.mjs (every build/dev start) — Vercel restores node_modules
// from cache without re-running postinstall when the lockfile is
// unchanged, so postinstall alone silently loses this patch.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const applyRangoMetamaskPatch = () => {
  const file = join(
    process.cwd(),
    "node_modules",
    "@rango-dev",
    "provider-metamask",
    "dist",
    "mod.js",
  );

  if (!existsSync(file)) return;

  let src = readFileSync(file, "utf8");

  // Already fully patched?
  if (src.includes("__dexifier_eip6963__")) return;

  // --- Stage 1: strict resolution (idempotent) -----------------------------
  if (!src.includes("isTronLink")) {
    // 1a. isEthereumMetamaskProvider: add the two known isMetaMask impostors
    //     to the blocklist. Anchor: last blocklist entry before function end.
    const BLOCKLIST_ANCHOR = "||n.isSafePal)}";
    if (!src.includes(BLOCKLIST_ANCHOR)) {
      console.warn(`[patch] WARN: blocklist anchor not found in ${file} — provider-metamask layout changed, connect may misroute to impostor wallets`);
      return;
    }
    src = src.replace(BLOCKLIST_ANCHOR, "||n.isSafePal||n.isTronLink||n.isPhantom)}");

    // 1b. metamask(): when window.ethereum aggregates a .providers array
    //     (multi-wallet installs, or a hijacker like TronLink that pushed the
    //     real MetaMask aside), prefer the strictly-identified MetaMask entry.
    const GETTER_ANCHOR = "let{ethereum:n}=window,t=G();if(!n||!V(n))return null;";
    if (!src.includes(GETTER_ANCHOR)) {
      console.warn(`[patch] WARN: metamask() anchor not found in ${file} — provider-metamask layout changed, connect may misroute to impostor wallets`);
      return;
    }
    src = src.replace(
      GETTER_ANCHOR,
      "let{ethereum:n}=window,t=G();/*__dexifier_strict_mm__*/if(n&&Array.isArray(n.providers)){let r=n.providers.find(V);r&&(n=r)}if(!n||!V(n))return null;",
    );
  }

  // --- Stage 2: EIP-6963 primary resolution --------------------------------
  // Registry at module scope: subscribe once, warm immediately, re-ask on
  // demand. The getter stays synchronous; by modal-open time the
  // announcement has long landed.
  const REGISTRY_ANCHOR = "function d(){let{ethereum:n}=window,t=G();";
  if (!src.includes(REGISTRY_ANCHOR)) {
    console.warn(`[patch] WARN: metamask() function anchor not found in ${file} — provider-metamask layout changed, EIP-6963 fallback NOT applied`);
    return;
  }
  src = src.replace(
    REGISTRY_ANCHOR,
    '/*__dexifier_eip6963__*/const __mm6963=(()=>{let p=null;const ask=()=>{try{window.dispatchEvent(new Event("eip6963:requestProvider"))}catch(_){}};try{window.addEventListener("eip6963:announceProvider",e=>{const d=e.detail;if(d&&d.info&&(d.info.rdns==="io.metamask"||d.info.name==="MetaMask"))p=d.provider});ask()}catch(_){}return()=>{if(!p)ask();return p}})();function d(){let{ethereum:n}=window,t=G();',
  );

  // Bus wins when it has a strictly-valid MetaMask; otherwise the strict
  // window.ethereum resolution (stage 1) governs.
  const FALLBACK_ANCHOR = "r&&(n=r)}if(!n||!V(n))return null;";
  if (!src.includes(FALLBACK_ANCHOR)) {
    console.warn(`[patch] WARN: fallback anchor not found in ${file} — provider-metamask layout changed, EIP-6963 fallback NOT applied`);
    return;
  }
  src = src.replace(
    FALLBACK_ANCHOR,
    "r&&(n=r)}const a=__mm6963();a&&V(a)&&(n=a);if(!n||!V(n))return null;",
  );

  writeFileSync(file, src);
  console.log(`[patch] strict + EIP-6963 MetaMask resolution applied to ${file}`);
};

// Self-execute only when run directly (node scripts/patch-rango-metamask.mjs)
if (process.argv[1] && process.argv[1].endsWith("patch-rango-metamask.mjs")) {
  applyRangoMetamaskPatch();
}
