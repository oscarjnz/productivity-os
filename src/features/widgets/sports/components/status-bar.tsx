"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface StatusBarProps {
  isFetching: boolean;
  fetchedAt: number | null;
  liveCount: number;
  totalCount: number;
  onRefresh: () => void;
}

function relativeTime(ts: number | null): string {
  if (!ts) return "—";
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 5) return "hace un instante";
  if (diffSec < 60) return `hace ${diffSec}s`;
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  return `hace ${h}h`;
}

export function StatusBar({
  isFetching,
  fetchedAt,
  liveCount,
  totalCount,
  onRefresh,
}: StatusBarProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-0.5">
      <div className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.08em] text-[var(--color-text-lo)]">
        {liveCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-[var(--color-danger)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-danger)] opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-danger)]" />
            </span>
            {liveCount} en vivo
          </span>
        ) : (
          <span>{totalCount} partidos</span>
        )}
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isFetching}
        className={cn(
          "inline-flex items-center gap-1 rounded-[var(--radius-xs)] px-1.5 py-0.5",
          "text-[9.5px] uppercase tracking-[0.08em] text-[var(--color-text-lo)]",
          "hover:bg-[var(--color-bg-raised)] hover:text-[var(--color-text-mid)]",
          "disabled:cursor-progress",
          "transition-colors duration-[var(--duration-fast)]",
        )}
        aria-label="Actualizar"
      >
        <RefreshCw
          className={cn("h-2.5 w-2.5", isFetching && "animate-spin")}
          aria-hidden
        />
        {isFetching ? "Actualizando…" : relativeTime(fetchedAt)}
      </button>
    </div>
  );
}
