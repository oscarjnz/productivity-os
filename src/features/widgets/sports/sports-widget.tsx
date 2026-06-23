"use client";

import { memo, useMemo } from "react";
import { useSportsFeed, pinFavorites } from "./use-sports";
import type { SportsConfig } from "./config";
import { TickerVariant } from "./variants/ticker";
import { ListVariant } from "./variants/list";
import { PanelVariant } from "./variants/panel";
import { SportsOnboarding } from "./onboarding";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetProps } from "@/types/widget.types";

type Variant = "ticker" | "list" | "panel";

function pickVariant(config: SportsConfig, w: number, h: number): Variant {
  if (config.variant !== "auto") return config.variant;
  const area = w * h;
  if (w <= 2 && h <= 2) return "ticker";
  if (area >= 16 || (w >= 5 && h >= 3)) return "panel";
  return "list";
}

function SportsWidgetInner({ config, size, onConfigChange }: WidgetProps<SportsConfig>) {
  const { data, isLoading, isError, error, refetch } = useSportsFeed({
    leagues: config.leagues,
    sports: config.sports,
  });

  const events = useMemo(
    () => pinFavorites(data?.events ?? [], config.teams),
    [data, config.teams],
  );

  if (!config.onboarded) {
    return (
      <SportsOnboarding
        config={config}
        onComplete={(next) => onConfigChange({ ...next, onboarded: true })}
      />
    );
  }

  if (isError) {
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

  if (isLoading || !data) {
    return (
      <div className="flex h-full flex-col gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-2 px-2 py-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    );
  }

  const variant = pickVariant(config, size.w, size.h);

  if (variant === "ticker") return <TickerVariant events={events} />;
  if (variant === "list")
    return <ListVariant events={events} config={config} onChange={onConfigChange} />;
  return <PanelVariant events={events} config={config} onChange={onConfigChange} />;
}

export const SportsWidget = memo(SportsWidgetInner);
