"use client";

import { useQuery } from "@tanstack/react-query";
import type { StockQuote } from "@/app/api/stocks/route";

export type { StockQuote };

interface StocksResponse {
  quotes: StockQuote[];
  fetchedAt: number;
}

export function useStocks(symbols: string[], token?: string) {
  const key = symbols.map((s) => s.trim().toUpperCase()).filter(Boolean);
  return useQuery<StocksResponse>({
    queryKey: ["stocks", key.join(","), token ? "keyed" : "keyless"],
    enabled: key.length > 0,
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ symbols: key.join(",") });
      if (token) params.set("token", token);
      const res = await fetch(`/api/stocks?${params.toString()}`, { signal });
      if (!res.ok) throw new Error(`Stocks ${res.status}`);
      return (await res.json()) as StocksResponse;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    gcTime: 5 * 60_000,
  });
}
