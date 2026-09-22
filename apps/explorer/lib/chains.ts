// Uppercased chain/asset prefix → block-explorer tx URL template.
// Covers the common Rango/Exolix/Chainflip network spellings; unknown chains
// render without a link (no fake URLs).
const TX_EXPLORERS: Record<string, string> = {
  ETH: "https://etherscan.io/tx/",
  ETHEREUM: "https://etherscan.io/tx/",
  BTC: "https://mempool.space/tx/",
  BITCOIN: "https://mempool.space/tx/",
  BSC: "https://bscscan.com/tx/",
  BNB: "https://bscscan.com/tx/",
  POLYGON: "https://polygonscan.com/tx/",
  MATIC: "https://polygonscan.com/tx/",
  ARBITRUM: "https://arbiscan.io/tx/",
  ARB: "https://arbiscan.io/tx/",
  OPTIMISM: "https://optimistic.etherscan.io/tx/",
  OP: "https://optimistic.etherscan.io/tx/",
  AVAX: "https://snowtrace.io/tx/",
  AVALANCHE: "https://snowtrace.io/tx/",
  SOL: "https://solscan.io/tx/",
  SOLANA: "https://solscan.io/tx/",
  TRX: "https://tronscan.org/#/transaction/",
  TRON: "https://tronscan.org/#/transaction/",
  LTC: "https://litecoinspace.org/tx/",
  DOGE: "https://dogechain.info/tx/",
  TON: "https://tonscan.org/tx/",
  BASE: "https://basescan.org/tx/",
  LINEA: "https://lineascan.build/tx/",
  DOT: "https://polkadot.subscan.io/extrinsic/",
  ATOM: "https://www.mintscan.io/cosmos/tx/",
  COSMOS: "https://www.mintscan.io/cosmos/tx/",
  XRP: "https://xrpscan.com/tx/",
  ADA: "https://cardanoscan.io/transaction/",
};

export const txExplorerUrl = (chain: string, hash: string): string | null => {
  const key = (chain || "").toUpperCase().split(/[.\-_]/)[0];
  const base = TX_EXPLORERS[key];
  return base ? `${base}${hash}` : null;
};

export const shortHash = (value: string, head = 6, tail = 4): string =>
  value.length <= head + tail + 3
    ? value
    : `${value.slice(0, head)}…${value.slice(-tail)}`;

export const prettyChain = (chain: string): string =>
  (chain || "")
    .split(/[.\-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
