"use client";

import { useQuery } from "@tanstack/react-query";
import type { CryptoConfig, CryptoCurrency } from "./config";

export interface CryptoPrice {
  id: string;
  price: number;
  change24h: number;
  marketCap: number | null;
}

interface CoinGeckoResponse {
  [coinId: string]: {
    [currency: string]:
      | number
      | undefined;
  } & {
    [k: `${string}_24h_change`]: number | undefined;
    [k: `${string}_market_cap`]: number | undefined;
  };
}

export function useCryptoPrices(coins: string[], currency: CryptoCurrency) {
  return useQuery<CryptoPrice[]>({
    queryKey: ["crypto", coins.join(","), currency],
    enabled: coins.length > 0,
    queryFn: async ({ signal }) => {
      const ids = coins.map((c) => c.trim().toLowerCase()).filter(Boolean).join(",");
      const params = new URLSearchParams({
        ids,
        vs_currencies: currency,
        include_24hr_change: "true",
        include_market_cap: "true",
      });
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?${params.toString()}`,
        { signal },
      );
      if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
      const data = (await res.json()) as CoinGeckoResponse;

      return coins
        .map((id) => {
          const entry = data[id.toLowerCase()];
          if (!entry) return null;
          const price = entry[currency] as number | undefined;
          const change = entry[`${currency}_24h_change`] as number | undefined;
          const mcap = entry[`${currency}_market_cap`] as number | undefined;
          if (price === undefined) return null;
          return {
            id,
            price,
            change24h: change ?? 0,
            marketCap: mcap ?? null,
          };
        })
        .filter((p): p is CryptoPrice => p !== null);
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    gcTime: 5 * 60_000,
  });
}
