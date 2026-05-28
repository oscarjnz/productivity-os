"use client";

import { memo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCryptoPrices, type CryptoPrice } from "./use-crypto";
import { CURRENCY_SYMBOL, type CryptoConfig } from "./config";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { duration, easing } from "@/config/motion";
import type { WidgetProps } from "@/types/widget.types";

function formatPrice(value: number, currency: string): string {
  const decimals = value >= 1000 ? 0 : value >= 1 ? 2 : 6;
  const symbol = CURRENCY_SYMBOL[currency as keyof typeof CURRENCY_SYMBOL] ?? "";
  return `${symbol}${value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function CryptoRow({ price, currency }: { price: CryptoPrice; currency: string }) {
  const up = price.change24h >= 0;
  return (
    <motion.li
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: duration.fast, ease: easing.standard }}
      className={cn(
        "flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-1.5",
        "transition-colors duration-[var(--duration-fast)]",
        "hover:bg-[var(--color-bg-raised)]",
      )}
    >
      <span className="truncate text-[12.5px] capitalize text-[var(--color-text-hi)]">
        {price.id}
      </span>
      <div className="flex shrink-0 items-baseline gap-2">
        <span className="text-[12.5px] tabular text-[var(--color-text-hi)]">
          {formatPrice(price.price, currency)}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-[var(--radius-xs)] px-1 py-0.5",
            "text-[10.5px] font-medium tabular",
            up
              ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
              : "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
          )}
        >
          {up ? (
            <TrendingUp className="h-2.5 w-2.5" aria-hidden />
          ) : (
            <TrendingDown className="h-2.5 w-2.5" aria-hidden />
          )}
          {Math.abs(price.change24h).toFixed(2)}%
        </span>
      </div>
    </motion.li>
  );
}

function CryptoWidgetInner({ config }: WidgetProps<CryptoConfig>) {
  const { data, isLoading, isError, error, refetch } = useCryptoPrices(
    config.coins,
    config.currency,
  );

  if (config.coins.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-center text-[11.5px] text-[var(--color-text-lo)]">
        Open ⚙ to add coins.
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <div className="text-[12px] text-[var(--color-danger)]">
          {error instanceof Error ? error.message : "Failed to load"}
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="text-[11px] text-[var(--color-accent)] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex h-full flex-col gap-1.5">
        {config.coins.map((c) => (
          <div key={c} className="flex items-center justify-between gap-2 px-2 py-1.5">
            <Skeleton className="h-3 w-16" />
            <div className="flex gap-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-1">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-lo)]">
          24h change
        </span>
        <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-lo)]">
          {config.currency}
        </span>
      </div>
      <ul className="-mr-1 flex-1 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {data.map((p) => (
            <CryptoRow key={p.id} price={p} currency={config.currency} />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

export const CryptoWidget = memo(CryptoWidgetInner);
