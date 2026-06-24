"use client";

import { memo } from "react";
import type { SportsEvent } from "../types";
import { TeamLogo } from "./team-logo";
import { formatTime, relativeDay } from "../lib/format";
import { cn } from "@/lib/utils/cn";

interface MatchRowProps {
  event: SportsEvent;
  favoriteTeamIds?: ReadonlySet<string>;
  onClick?: (event: SportsEvent) => void;
  compact?: boolean;
}

function MatchRowInner({ event, favoriteTeamIds, onClick, compact }: MatchRowProps) {
  const isLive = event.status === "live";
  const isFinished = event.status === "finished";
  const isScheduled = event.status === "scheduled";
  const rel = relativeDay(event.startsAt);

  const homeFav = favoriteTeamIds?.has(event.home.id) ?? false;
  const awayFav = favoriteTeamIds?.has(event.away.id) ?? false;

  return (
    <button
      type="button"
      onClick={() => onClick?.(event)}
      className={cn(
        "group flex w-full items-center gap-2 rounded-[var(--radius-sm)]",
        "px-2 py-1.5 text-left",
        "transition-colors duration-[var(--duration-fast)]",
        "hover:bg-[var(--color-bg-raised)]",
        (homeFav || awayFav) && "ring-1 ring-inset ring-[var(--color-accent)]/30",
      )}
    >
      {/* Status indicator column */}
      <div className="flex w-10 shrink-0 flex-col items-center justify-center gap-0.5">
        {isLive ? (
          <span className="inline-flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-danger)] opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-danger)]" />
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--color-danger)]">
              {event.clock ?? "LIVE"}
            </span>
          </span>
        ) : isFinished ? (
          <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-lo)]">
            FT
          </span>
        ) : (
          <>
            <span
              className={cn(
                "text-[8.5px] font-semibold uppercase tracking-[0.04em] leading-none",
                rel.today ? "text-[var(--color-text-lo)]" : "text-[var(--color-accent)]",
              )}
            >
              {rel.label}
            </span>
            <span className="text-[10px] leading-none tabular text-[var(--color-text-lo)]">
              {formatTime(event.startsAt)}
            </span>
          </>
        )}
      </div>

      {/* Teams stacked */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <TeamLogo src={event.home.logo} alt={event.home.name} size={compact ? 14 : 16} />
            <span
              className={cn(
                "min-w-0 truncate text-[12px]",
                homeFav
                  ? "font-semibold text-[var(--color-text-hi)]"
                  : "text-[var(--color-text-mid)]",
              )}
            >
              {event.home.shortName || event.home.name}
            </span>
          </span>
          <span
            className={cn(
              "shrink-0 tabular",
              isScheduled
                ? "text-[var(--color-text-lo)]"
                : "font-semibold text-[var(--color-text-hi)]",
              compact ? "text-[12px]" : "text-[12.5px]",
            )}
          >
            {event.home.score ?? "—"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <TeamLogo src={event.away.logo} alt={event.away.name} size={compact ? 14 : 16} />
            <span
              className={cn(
                "min-w-0 truncate text-[12px]",
                awayFav
                  ? "font-semibold text-[var(--color-text-hi)]"
                  : "text-[var(--color-text-mid)]",
              )}
            >
              {event.away.shortName || event.away.name}
            </span>
          </span>
          <span
            className={cn(
              "shrink-0 tabular",
              isScheduled
                ? "text-[var(--color-text-lo)]"
                : "font-semibold text-[var(--color-text-hi)]",
              compact ? "text-[12px]" : "text-[12.5px]",
            )}
          >
            {event.away.score ?? "—"}
          </span>
        </div>
      </div>
    </button>
  );
}

export const MatchRow = memo(MatchRowInner);
