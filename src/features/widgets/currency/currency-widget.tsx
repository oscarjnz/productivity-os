"use client";

import { memo, useMemo, useState } from "react";
import { ArrowRightLeft, RefreshCw } from "lucide-react";
import { useCurrencyRates } from "./use-currency";
import { CURRENCY_META, type CurrencyConfig, type CurrencyCode } from "./config";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import type { WidgetProps } from "@/types/widget.types";

function formatAmount(value: number, code: CurrencyCode): string {
  const decimals = value >= 1000 ? 0 : value >= 1 ? 2 : 4;
  const meta = CURRENCY_META[code];
  return `${meta.symbol}${value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function convert(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  ratesByBase: Record<CurrencyCode, Record<string, number> | undefined>,
): number | null {
  if (from === to) return amount;
  const direct = ratesByBase[from]?.[to];
  if (typeof direct === "number") return amount * direct;
  // Fallback: convert via USD if we have USD rates for both
  const usd = ratesByBase.USD;
  if (usd) {
    const fromUsd = from === "USD" ? 1 : usd[from];
    const toUsd = to === "USD" ? 1 : usd[to];
    if (typeof fromUsd === "number" && typeof toUsd === "number" && fromUsd !== 0) {
      return (amount / fromUsd) * toUsd;
    }
  }
  return null;
}

function CurrencyWidgetInner({ config, onConfigChange }: WidgetProps<CurrencyConfig>) {
  const [amount, setAmount] = useState<string>(String(config.amount ?? 1));
  const numericAmount = Number.parseFloat(amount) || 0;

  const { data, isLoading, isError, error, refetch, isFetching } = useCurrencyRates(config.base);
  const usdQuery = useCurrencyRates("USD");

  const ratesByBase = useMemo(() => {
    return {
      [config.base]: data?.rates,
      USD: usdQuery.data?.rates,
    } as Record<CurrencyCode, Record<string, number> | undefined>;
  }, [data, usdQuery.data, config.base]);

  const swap = (i: number) => {
    const next = config.pairs.slice();
    const p = next[i]!;
    next[i] = { from: p.to, to: p.from };
    onConfigChange({ ...config, pairs: next });
  };

  if (isError && !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <div className="text-[12px] text-[var(--color-danger)]">
          {error instanceof Error ? error.message : "Falló la carga"}
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="text-[11px] text-[var(--color-accent)] hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Header: base + refresh */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-lo)]">
          <span>Base · {config.base}</span>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className={cn(
            "inline-flex items-center gap-1 rounded-[var(--radius-xs)] px-1.5 py-0.5",
            "text-[9.5px] uppercase tracking-[0.08em] text-[var(--color-text-lo)]",
            "hover:bg-[var(--color-bg-raised)] hover:text-[var(--color-text-mid)]",
          )}
        >
          <RefreshCw
            className={cn("h-2.5 w-2.5", isFetching && "animate-spin")}
            aria-hidden
          />
          {isFetching ? "Actualizando…" : (data?.fetchedAt?.slice(0, 10) ?? "")}
        </button>
      </div>

      {/* Converter row */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-[var(--radius-sm)]",
          "border border-[var(--color-border)] bg-[var(--color-bg-base)] p-2",
        )}
      >
        <span aria-hidden className="text-base">
          {CURRENCY_META[config.base].flag}
        </span>
        <input
          type="number"
          min="0"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onBlur={() => {
            const v = Number.parseFloat(amount);
            if (!Number.isNaN(v)) onConfigChange({ ...config, amount: v });
          }}
          aria-label={`Cantidad en ${config.base}`}
          className={cn(
            "flex-1 bg-transparent text-[14px] tabular text-[var(--color-text-hi)]",
            "outline-none [appearance:textfield]",
            "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          )}
        />
        <select
          value={config.base}
          onChange={(e) => onConfigChange({ ...config, base: e.target.value as CurrencyCode })}
          className={cn(
            "rounded-[var(--radius-xs)] border border-[var(--color-border)]",
            "bg-[var(--color-bg-base)] px-1.5 py-0.5",
            "text-[11px] font-medium text-[var(--color-text-hi)] outline-none",
            "focus:border-[var(--color-accent)]",
          )}
        >
          {Object.keys(CURRENCY_META).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Quick pairs */}
      <ul className="-mr-1 flex-1 overflow-y-auto pr-1">
        {(isLoading && !data) ? (
          Array.from({ length: config.pairs.length || 3 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-2 px-2 py-1.5"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </li>
          ))
        ) : (
          config.pairs.map((pair, i) => {
            const converted = convert(numericAmount, pair.from, pair.to, ratesByBase);
            return (
              <li
                key={`${pair.from}-${pair.to}-${i}`}
                className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-[var(--color-bg-raised)]"
              >
                <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--color-text-mid)]">
                  <span aria-hidden>{CURRENCY_META[pair.from].flag}</span>
                  <span className="font-medium">{pair.from}</span>
                  <button
                    type="button"
                    onClick={() => swap(i)}
                    aria-label="Invertir par"
                    className="text-[var(--color-text-lo)] hover:text-[var(--color-text-mid)]"
                  >
                    <ArrowRightLeft className="h-2.5 w-2.5" aria-hidden />
                  </button>
                  <span aria-hidden>{CURRENCY_META[pair.to].flag}</span>
                  <span className="font-medium">{pair.to}</span>
                </span>
                <span className="shrink-0 tabular text-[12px] font-semibold text-[var(--color-text-hi)]">
                  {converted === null ? "—" : formatAmount(converted, pair.to)}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

export const CurrencyWidget = memo(CurrencyWidgetInner);
