import "server-only";
import type {
  SwapListResponse,
  SwapRow,
  SwapSummary,
} from "./types";

// The explorer reads from Dexifier's own swap API — swap data is public by
// design, no keys. Default is the production site; Railway can override with
// the internal service URL once both apps live on the same private network.
const API_URL = process.env.DEXIFIER_API_URL || "https://www.dexifier.com";

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (error) {
    console.error(`swaps fetch failed for ${path}:`, error);
    return null;
  }
}

export const getSwaps = (page = 0, status?: string): Promise<SwapListResponse | null> =>
  fetchJson<SwapListResponse>(
    `/api/swaps?page=${page}${status && status !== "all" ? `&status=${status}` : ""}`,
  );

export const getSwap = async (externalId: string): Promise<SwapRow | null> => {
  const data = await fetchJson<{ detailedTransaction: SwapRow }>(
    `/api/swaps/${encodeURIComponent(externalId)}`,
  );
  return data?.detailedTransaction ?? null;
};

export const searchSwaps = async (query: string): Promise<SwapRow[]> => {
  const data = await fetchJson<{ searchResult: SwapRow[] }>(
    `/api/swaps/search?query=${encodeURIComponent(query)}`,
  );
  return data?.searchResult ?? [];
};

export const getSummary = (): Promise<SwapSummary | null> =>
  fetchJson<SwapSummary>("/api/swaps/summary");
