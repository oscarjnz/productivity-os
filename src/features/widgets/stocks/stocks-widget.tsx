"use client";

import { memo } from "react";
import { TrendingUp, TrendingDown, LineChart, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useStocks, type StockQuote } from "./use-stocks";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { duration, easing } from "@/config/motion";
import type { WidgetProps } from "@/types/widget.types";
import type { StocksConfig } from "./config";

function formatPrice(value: number, currency: string | null): string {
  const decimals = Math.abs(value) >= 1000 ? 0 : 2;
  const n = value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  if (!currency || currency === "USD") return `$${n}`;
  return `${n} ${currency}`;
}

function Sparkline({ points, up }: { points: number[]; up: boolean }) {
  if (points.length < 2) return <div className="h-7 w-full" aria-hidden />;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const step = w / (points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(2)},${(h - ((p - min) / range) * h).toFixed(2)}`)
    .join(" ");
  const color = up ? "var(--color-success)" : "var(--color-danger)";
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-7 w-full"
      aria-hidden
    >
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function StockRow({ q }: { q: StockQuote }) {
  const up = q.change >= 0;
  return (
    <motion.li
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: duration.fast, ease: easing.standard }}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-sm)] px-2 py-1.5",
        "transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-bg-raised)]",
      )}
    >
      <span className="w-14 shrink-0 truncate text-[12.5px] font-semibold text-[var(--color-text-hi)]">
        {q.symbol}
      </span>
      <div className="hidden min-w-0 flex-1 sm:block">
        <Sparkline points={q.spark} up={up} />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-[12.5px] tabular text-[var(--color-text-hi)]">
          {formatPrice(q.price, q.currency)}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 text-[10.5px] font-medium tabular",
            up ? "text-[var(--color-success)]" : "text-[var(--color-danger)]",
          )}
        >
          {up ? (
            <TrendingUp className="h-2.5 w-2.5" aria-hidden />
          ) : (
            <TrendingDown className="h-2.5 w-2.5" aria-hidden />
          )}
          {up ? "+" : ""}
          {q.changePct.toFixed(2)}%
        </span>
      </div>
    </motion.li>
  );
}

function StocksWidgetInner({ config }: WidgetProps<StocksConfig>) {
  const { data, isLoading, isError, error, refetch } = useStocks(config.symbols, config.token);

  if (config.symbols.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <LineChart className="h-6 w-6 text-[var(--color-text-lo)]" strokeWidth={1.5} aria-hidden />
        <div className="text-[11.5px] text-[var(--color-text-mid)]">No tickers yet</div>
        <div className="inline-flex items-center gap-1 text-[10.5px] text-[var(--color-text-lo)]">
          <Settings2 className="h-3 w-3" aria-hidden />
          Open settings to add symbols
        </div>
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
        {config.symbols.map((s) => (
          <div key={s} className="flex items-center justify-between gap-2 px-2 py-1.5">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>
    );
  }

  if (data.quotes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 px-4 text-center">
        <div className="text-[12px] text-[var(--color-text-mid)]">No data</div>
        <div className="text-[10.5px] text-[var(--color-text-lo)]">
          Check the ticker symbols in settings.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-1">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-lo)]">
          {config.token ? "Live" : "Delayed"}
        </span>
        <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-lo)]">
          Day
        </span>
      </div>
      <ul className="-mr-1 flex-1 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {data.quotes.map((q) => (
            <StockRow key={q.symbol} q={q} />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

export const StocksWidget = memo(StocksWidgetInner);
