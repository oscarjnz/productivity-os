"use client";

import { useQuery } from "@tanstack/react-query";
import type { CurrencyCode } from "./config";

export interface CurrencyResponse {
  base: string;
  rates: Record<string, number>;
  fetchedAt: string;
  source: string;
}

export function useCurrencyRates(base: CurrencyCode) {
  return useQuery<CurrencyResponse>({
    queryKey: ["currency", base],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/currency?base=${base}`, { signal });
      if (!res.ok) throw new Error(`Currency ${res.status}`);
      return (await res.json()) as CurrencyResponse;
    },
    /** Rates change once per day upstream. */
    staleTime: 60 * 60_000,
    refetchInterval: 60 * 60_000,
    gcTime: 24 * 60 * 60_000,
  });
}
