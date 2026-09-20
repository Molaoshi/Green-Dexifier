"use client";

// Terminal state: markets, live book/trades/ctx for the selected coin, and
// the connected account (agent + builder consent + positions/orders/fills).

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import {
  fetchAccount,
  fetchFills,
  fetchMarkets,
  fetchMaxBuilderFee,
  fetchOpenOrders,
  subscribeAllMids,
  subscribeAssetCtx,
  subscribeBook,
  subscribeOrderUpdates,
  subscribeTrades,
  subscribeUserFills,
} from "./hl/adapter";
import { useEvmWallet, useRawProviders, getEvmSigner } from "./hl/wallet";
import {
  approveAgent as approveAgentTx,
  approveBuilderFee as approveBuilderTx,
  createAgent,
  loadAgent,
  type AgentWallet,
} from "./hl/trading";
import { BUILDER_ADDRESS, BUILDER_ENABLED } from "./config";
import type {
  AccountSummary,
  BookLevel,
  Fill,
  OpenOrder,
  Position,
  Tape,
  VenueMarket,
} from "./venue/types";

interface PerpContextValue {
  markets: VenueMarket[];
  mids: Record<string, number>;
  marketsLoading: boolean;
  selected: VenueMarket | null;
  selectCoin: (coin: string) => void;
  bids: BookLevel[];
  asks: BookLevel[];
  tape: Tape[];
  liveMark: number | null;
  liveFunding: number | null;
  liveOi: number | null;
  // account
  user: `0x${string}` | null;
  agent: AgentWallet | null;
  builderApproved: boolean;
  accountSummary: AccountSummary | null;
  positions: Position[];
  openOrders: OpenOrder[];
  fills: Fill[];
  accountLoading: boolean;
  refreshAccount: () => Promise<void>;
  enableAgent: () => Promise<void>;
  consentBuilder: () => Promise<void>;
  setupBusy: "agent" | "builder" | null;
}

const PerpContext = createContext<PerpContextValue | null>(null);

export function usePerp(): PerpContextValue {
  const ctx = useContext(PerpContext);
  if (!ctx) throw new Error("usePerp must be used inside PerpProvider");
  return ctx;
}

function readInitialCoin(): string {
  if (typeof window === "undefined") return "BTC";
  const p = new URLSearchParams(window.location.search).get("asset");
  return p ? p.toUpperCase() : "BTC";
}

export function PerpProvider({ children }: { children: React.ReactNode }) {
  // ----- markets -----
  const [markets, setMarkets] = useState<VenueMarket[]>([]);
  const [mids, setMids] = useState<Record<string, number>>({});
  const [marketsLoading, setMarketsLoading] = useState(true);
  const [coin, setCoin] = useState<string>(readInitialCoin);

  // ----- live selected-coin data -----
  const [bids, setBids] = useState<BookLevel[]>([]);
  const [asks, setAsks] = useState<BookLevel[]>([]);
  const [tape, setTape] = useState<Tape[]>([]);
  const [liveMark, setLiveMark] = useState<number | null>(null);
  const [liveFunding, setLiveFunding] = useState<number | null>(null);
  const [liveOi, setLiveOi] = useState<number | null>(null);

  // ----- account -----
  const evm = useEvmWallet();
  const rawProviders = useRawProviders();
  const user = evm?.address ?? null;
  const [agent, setAgent] = useState<AgentWallet | null>(null);
  const [builderApproved, setBuilderApproved] = useState(false);
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [fills, setFills] = useState<Fill[]>([]);
  const [accountLoading, setAccountLoading] = useState(false);
  const [setupBusy, setSetupBusy] = useState<"agent" | "builder" | null>(null);

  const marketsRef = useRef<VenueMarket[]>([]);
  marketsRef.current = markets;

  // ----- market list: initial load + 30s stats refresh -----
  useEffect(() => {
    let cancelled = false;
    const load = async (initial: boolean) => {
      try {
        const list = await fetchMarkets();
        if (!cancelled) {
          setMarkets(list);
          if (initial) setMarketsLoading(false);
        }
      } catch {
        if (initial && !cancelled) setMarketsLoading(false);
      }
    };
    load(true);
    const t = setInterval(() => load(false), 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  // ----- all mids: single WS for the whole app -----
  useEffect(() => {
    let sub: { unsubscribe: () => Promise<void> } | null = null;
    let dead = false;
    subscribeAllMids((m) => !dead && setMids(m))
      .then((s) => (sub = s))
      .catch(() => {});
    return () => {
      dead = true;
      sub?.unsubscribe().catch(() => {});
    };
  }, []);

  // ----- selected coin: book + trades + ctx subscriptions -----
  useEffect(() => {
    let dead = false;
    const subs: { unsubscribe: () => Promise<void> }[] = [];
    setBids([]);
    setAsks([]);
    setTape([]);
    setLiveMark(null);

    subscribeBook(coin, (b, a) => {
      if (dead) return;
      setBids(b);
      setAsks(a);
    }).then((s) => subs.push(s)).catch(() => {});

    subscribeTrades(coin, (list) => {
      if (dead) return;
      setTape((prev) => [...list.reverse(), ...prev].slice(0, 60));
    }).then((s) => subs.push(s)).catch(() => {});

    subscribeAssetCtx(coin, (ctx) => {
      if (dead) return;
      setLiveMark(ctx.markPx || null);
      setLiveFunding(ctx.funding);
      setLiveOi(ctx.openInterest);
    }).then((s) => subs.push(s)).catch(() => {});

    return () => {
      dead = true;
      subs.forEach((s) => s.unsubscribe().catch(() => {}));
    };
  }, [coin]);

  // ----- URL sync (?asset=) -----
  const selectCoin = useCallback((c: string) => {
    setCoin(c);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("asset", c);
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  // ----- selected market object (live mid merged in) -----
  const selected = useMemo(() => {
    const m = markets.find((x) => x.coin === coin) ?? null;
    if (!m) return markets[0] ?? null;
    const mid = mids[m.coin];
    if (mid == null) return m;
    return {
      ...m,
      midPx: mid,
      markPx: liveMark ?? m.markPx,
      change24h: m.prevDayPx ? (mid - m.prevDayPx) / m.prevDayPx : m.change24h,
      funding: liveFunding ?? m.funding,
      openInterest: liveOi ?? m.openInterest,
    };
  }, [markets, mids, coin, liveMark, liveFunding, liveOi]);

  // ----- account: agent load + data polling + user subs -----
  const refreshAccount = useCallback(async () => {
    if (!user) return;
    try {
      const [acct, orders, fillList, maxFee] = await Promise.all([
        fetchAccount(user),
        fetchOpenOrders(user),
        fetchFills(user),
        BUILDER_ENABLED ? fetchMaxBuilderFee(user, BUILDER_ADDRESS) : Promise.resolve(0),
      ]);
      setAccountSummary(acct.summary);
      setPositions(
        acct.positions.map((p) => ({
          ...p,
          assetId: marketsRef.current.find((m) => m.coin === p.coin)?.assetId ?? 0,
        })),
      );
      setOpenOrders(
        orders.map((o) => ({
          ...o,
          assetId: marketsRef.current.find((m) => m.coin === o.coin)?.assetId ?? 0,
        })),
      );
      setFills(fillList);
      setBuilderApproved(maxFee > 0);
    } catch {
      /* keep previous state */
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setAgent(null);
      setAccountSummary(null);
      setPositions([]);
      setOpenOrders([]);
      setFills([]);
      setBuilderApproved(false);
      return;
    }
    setAccountLoading(true);
    setAgent(loadAgent(user));
    refreshAccount().finally(() => setAccountLoading(false));
    const t = setInterval(refreshAccount, 12_000);
    const subs: { unsubscribe: () => Promise<void> }[] = [];
    subscribeUserFills(user, () => refreshAccount()).then((s) => subs.push(s)).catch(() => {});
    subscribeOrderUpdates(user, () => refreshAccount()).then((s) => subs.push(s)).catch(() => {});
    return () => {
      clearInterval(t);
      subs.forEach((s) => s.unsubscribe().catch(() => {}));
    };
  }, [user, refreshAccount]);

  // ----- setup actions -----
  const enableAgent = useCallback(async () => {
    if (!user || !evm) return;
    setSetupBusy("agent");
    try {
      const signer = await getEvmSigner(rawProviders, evm.walletType, evm.address);
      const fresh = createAgent(user);
      await approveAgentTx(signer, fresh);
      setAgent(fresh);
      toast.success("One-click trading enabled — session key stored locally.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Agent approval failed");
    } finally {
      setSetupBusy(null);
    }
  }, [user, evm, rawProviders]);

  const consentBuilder = useCallback(async () => {
    if (!user || !evm) return;
    setSetupBusy("builder");
    try {
      const signer = await getEvmSigner(rawProviders, evm.walletType, evm.address);
      await approveBuilderTx(signer);
      setBuilderApproved(true);
      toast.success("Builder fee approved — revocable anytime, on-chain.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Builder approval failed");
    } finally {
      setSetupBusy(null);
    }
  }, [user, evm, rawProviders]);

  const value: PerpContextValue = {
    markets,
    mids,
    marketsLoading,
    selected,
    selectCoin,
    bids,
    asks,
    tape,
    liveMark,
    liveFunding,
    liveOi,
    user,
    agent,
    builderApproved,
    accountSummary,
    positions,
    openOrders,
    fills,
    accountLoading,
    refreshAccount,
    enableAgent,
    consentBuilder,
    setupBusy,
  };

  return <PerpContext.Provider value={value}>{children}</PerpContext.Provider>;
}
