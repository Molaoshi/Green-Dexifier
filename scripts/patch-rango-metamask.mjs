// @rango-dev/provider-metamask identifies "MetaMask" by reading
// window.ethereum ONLY and checking isMetaMask against a blocklist that
// includes neither isPhantom nor isTronLink.
//
// TronLink 4.x hijacks window.ethereum: it installs a getter/setter via
// Object.defineProperties, pushes the real MetaMask into a .providers
// array, and its own EVM provider spoofs isMetaMask=true (with
// isTronLink=true alongside). Rango's hub then treats TronLink as
// MetaMask: connect requests land in TronLink's popup queue and the
// wallet tile hangs on "connecting" forever, while the preflight (which
// resolves MetaMask strictly via .providers) already succeeded — i.e.
// MetaMask shows the site as connected but the UI never advances.
//
// Fix: teach provider-metamask the same strict resolution the app uses —
// reject isTronLink/isPhantom impostors, and prefer the real MetaMask
// from window.ethereum.providers when another wallet owns the injection
// point. Runs automatically via the postinstall hook.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const file = join(
  process.cwd(),
  "node_modules",
  "@rango-dev",
  "provider-metamask",
  "dist",
  "mod.js",
);

if (!existsSync(file)) {
  process.exit(0);
}

let src = readFileSync(file, "utf8");

// Already patched?
if (src.includes("isTronLink") || src.includes("__dexifier_strict_mm__")) {
  process.exit(0);
}

// 1. isEthereumMetamaskProvider: add the two known isMetaMask impostors to
//    the blocklist. Anchor: the last blocklist entry before the function end.
const BLOCKLIST_ANCHOR = "||n.isSafePal)}";
if (!src.includes(BLOCKLIST_ANCHOR)) {
  console.warn(`[patch] WARN: blocklist anchor not found in ${file} — provider-metamask layout changed, connect may misroute to impostor wallets`);
  process.exit(0);
}
src = src.replace(BLOCKLIST_ANCHOR, "||n.isSafePal||n.isTronLink||n.isPhantom)}");

// 2. metamask(): when window.ethereum aggregates a .providers array
//    (multi-wallet installs, or a hijacker like TronLink that pushed the
//    real MetaMask aside), prefer the strictly-identified MetaMask entry.
const GETTER_ANCHOR = "let{ethereum:n}=window,t=G();if(!n||!V(n))return null;";
if (!src.includes(GETTER_ANCHOR)) {
  console.warn(`[patch] WARN: metamask() anchor not found in ${file} — provider-metamask layout changed, connect may misroute to impostor wallets`);
  process.exit(0);
}
src = src.replace(
  GETTER_ANCHOR,
  "let{ethereum:n}=window,t=G();/*__dexifier_strict_mm__*/if(n&&Array.isArray(n.providers)){let r=n.providers.find(V);r&&(n=r)}if(!n||!V(n))return null;",
);

writeFileSync(file, src);
console.log(`[patch] strict MetaMask resolution applied to ${file}`);
